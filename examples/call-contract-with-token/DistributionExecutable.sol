//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {IAxelarExecutable} from "@axelar-network/axelar-cgp-solidity/src/interfaces/IAxelarExecutable.sol";
import {IERC20} from "@axelar-network/axelar-cgp-solidity/src/interfaces/IERC20.sol";
import {IAxelarGasReceiver} from "@axelar-network/axelar-cgp-solidity/src/interfaces/IAxelarGasReceiver.sol";

contract DistributionExecutable is IAxelarExecutable {
   IAxelarGasReceiver gasReceiver;

    constructor(address _gateway, address _gasReceiver) IAxelarExecutable(_gateway) {
        gasReceiver = IAxelarGasReceiver(_gasReceiver);
    }

    function payGasAndCallContractWithToken(
        string memory destinationChain,
        string memory destinationAddress,
        bytes calldata payload,
        string memory symbol,
        uint256 amount
    ) external payable {
        address tokenAddress = gateway.tokenAddresses(symbol);
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount);
        IERC20(tokenAddress).approve(address(gateway), amount);
        gasReceiver.payNativeGasForContractCallWithToken{value: msg.value}(
            destinationChain,
            destinationAddress,
            payload,
            symbol,
            amount
        );
        gateway.callContractWithToken(destinationChain, destinationAddress, payload, symbol, amount);
    }
    function _executeWithToken(
        string memory,
        string memory,
        bytes calldata payload,
        string memory tokenSymbol,
        uint256 amount
    ) internal override {
        address[] memory recipients = abi.decode(payload, (address[]));
        address tokenAddress = gateway.tokenAddresses(tokenSymbol);

        uint256 sentAmount = amount / recipients.length;
        for (uint256 i = 0; i < recipients.length; i++) {
            IERC20(tokenAddress).transfer(recipients[i], sentAmount);
        }
    }
}
