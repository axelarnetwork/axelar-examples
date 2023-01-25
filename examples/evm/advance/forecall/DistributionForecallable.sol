//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';
import { AxelarForecallable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executables/AxelarForecallable.sol';
import { Upgradable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/upgradables/Upgradable.sol';
import { AddressToString } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/StringAddressUtils.sol';

contract DistributionForecallable is AxelarForecallable, Upgradable {
    using AddressToString for address;
    IAxelarGasService public immutable gasReceiver;

    constructor(address gateway_, address gasReceiver_) AxelarForecallable(gateway_) {
        gasReceiver = IAxelarGasService(gasReceiver_);
    }

    function _sendToMany(
        string memory destinationChain,
        address[] calldata destinationAddresses,
        string memory symbol,
        uint256 amount,
        uint256 feePercent
    ) internal {
        address tokenAddress = gateway.tokenAddresses(symbol);
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount);
        IERC20(tokenAddress).approve(address(gateway), amount);
        bytes memory payload = abi.encode(feePercent, destinationAddresses);
        gateway.callContractWithToken(destinationChain, address(this).toString(), payload, symbol, amount);
    }

    function sendToMany(
        string memory destinationChain,
        address[] calldata destinationAddresses,
        string memory symbol,
        uint256 amount
    ) external payable {
        _sendToMany(destinationChain, destinationAddresses, symbol, amount, 0);
    }

    function sendToManyForecall(
        string memory destinationChain,
        address[] calldata destinationAddresses,
        string memory symbol,
        uint256 amount,
        uint64 feeNum,
        uint64 feeDenom,
        uint128 salt
    ) external payable {
        uint256 feePercent = feeNum + (uint256(feeDenom) << 64) + (uint256(salt) << 128);
        _sendToMany(destinationChain, destinationAddresses, symbol, amount, feePercent);
    }

    function _executeWithToken(
        string calldata,
        string calldata,
        bytes calldata payload,
        string calldata tokenSymbol,
        uint256 amount
    ) internal override {
        (, address[] memory recipients) = abi.decode(payload, (uint256, address[]));
        address tokenAddress = gateway.tokenAddresses(tokenSymbol);

        uint256 sentAmount = amount / recipients.length;
        for (uint256 i = 0; i < recipients.length; i++) {
            IERC20(tokenAddress).transfer(recipients[i], sentAmount);
        }
    }

    function amountPostFee(uint256 amount, bytes calldata payload) public pure override returns (uint256) {
        uint256 feePercent = abi.decode(payload, (uint256));
        uint64 num = uint64(feePercent);
        uint64 denom = uint64(feePercent >> 64);
        if (denom == 0) return amount;
        return amount - (amount * num) / denom;
    }

    function contractId() external pure returns (bytes32) {
        return keccak256('example');
    }
}
