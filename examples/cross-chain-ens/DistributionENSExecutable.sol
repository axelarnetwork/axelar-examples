//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {IAxelarExecutable} from "@axelar-network/axelar-cgp-solidity/src/interfaces/IAxelarExecutable.sol";
import {IERC20} from "@axelar-network/axelar-cgp-solidity/src/interfaces/IERC20.sol";
import {IAxelarGasReceiver} from "@axelar-network/axelar-cgp-solidity/src/interfaces/IAxelarGasReceiver.sol";
import "./interfaces/IENS.sol";
import "./interfaces/IENSResolver.sol";

contract DistributionENSExecutable is IAxelarExecutable {
    IAxelarGasReceiver gasReceiver;

    event RecipientAddress(string indexed recipient);

    constructor(address _gateway, address _gasReceiver)
        IAxelarExecutable(_gateway)
    {
        gasReceiver = IAxelarGasReceiver(_gasReceiver);
    }

    function sendToMany(
        string memory destinationChain,
        string memory destinationAddress,
        bytes32[] calldata destinationAddresses,
        address ensRegistryAddress,
        string memory symbol,
        uint256 amount
    ) external payable {
        address tokenAddress = gateway.tokenAddresses(symbol);
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount);
        IERC20(tokenAddress).approve(address(gateway), amount);
        bytes memory payload = abi.encode(
            ensRegistryAddress,
            destinationAddresses
        );
        if (msg.value > 0) {
            gasReceiver.payNativeGasForContractCallWithToken{value: msg.value}(
                address(this),
                destinationChain,
                destinationAddress,
                payload,
                symbol,
                amount,
                msg.sender
            );
        }
        gateway.callContractWithToken(
            destinationChain,
            destinationAddress,
            payload,
            symbol,
            amount
        );
    }

    function _executeWithToken(
        string memory,
        string memory,
        bytes calldata payload,
        string memory tokenSymbol,
        uint256 amount
    ) internal override {
        (address ensRegistryAddress, bytes32[] memory recipients) = abi.decode(
            payload,
            (address, bytes32[])
        );
        address tokenAddress = gateway.tokenAddresses(tokenSymbol);

        uint256 sentAmount = amount / recipients.length;

        for (uint256 i = 0; i < recipients.length; i++) {
            bytes32 recipient = recipients[i];
            address ensResolvedAddress;
            if (recipient == bytes32(uint256(uint160(uint256(recipient))))) {
                ensResolvedAddress = address(uint160(uint256(recipient)));
            } else {
                IENS ens = IENS(ensRegistryAddress);
                IENSResolver resolver = ens.resolver(recipients[i]);
                ensResolvedAddress = resolver.addr(recipients[i]);
            }
            IERC20(tokenAddress).transfer(ensResolvedAddress, sentAmount);
        }
    }

    function executeLocal(
        string memory,
        string memory,
        bytes calldata payload,
        string memory tokenSymbol,
        uint256 amount
    ) external {
        address token = gateway.tokenAddresses(tokenSymbol);
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        _executeWithToken("", "", payload, tokenSymbol, amount);
    }
}
