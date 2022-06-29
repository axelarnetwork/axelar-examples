//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import { IAxelarExecutable } from '@axelar-network/axelar-cgp-solidity/contracts/interfaces/IAxelarExecutable.sol';
import { IERC20 } from '@axelar-network/axelar-cgp-solidity/contracts/interfaces/IERC20.sol';
import { IAxelarGasService } from '@axelar-network/axelar-cgp-solidity/contracts/interfaces/IAxelarGasService.sol';

contract HelloBack is IAxelarExecutable {
    string public message;
    IAxelarGasService gasReceiver;

    constructor(address _gateway, address _gasReceiver) IAxelarExecutable(_gateway) {
        gasReceiver = IAxelarGasService(_gasReceiver);
    }

    function _sayHelloBack(
        string memory destinationChain,
        string memory destinationAddress,
        bytes memory payload,
        string memory tokenSymbol,
        uint256 gasFeeAmount,
        address refundAddress
    ) internal {
        address gasToken = gateway.tokenAddresses(tokenSymbol);
        IERC20(gasToken).approve(address(gasReceiver), gasFeeAmount);
        gasReceiver.payGasForContractCall(
            address(this),
            destinationChain,
            destinationAddress,
            payload,
            gasToken,
            gasFeeAmount,
            refundAddress
        );
        gateway.callContract(destinationChain, destinationAddress, payload);
    }

    function _otherCallback(
        bytes memory payload,
        uint256 _amount,
        string memory tokenSymbol,
        address _finalTokenRecipient
    ) internal {
        (message) = abi.decode(payload, (string));
        address tokenAddress = gateway.tokenAddresses(tokenSymbol);
        IERC20(tokenAddress).transfer(_finalTokenRecipient, _amount);
    }

    function _executeWithToken(
        string memory sourceChain,
        string memory sourceContract,
        bytes calldata payload,
        string memory tokenSymbol,
        uint256 _amount
    ) internal override {
        (uint256 _gasFeeAmountForReturn, address _refundAddress, address _finalTokenRecipients, bytes memory originalPayload) = abi.decode(
            payload,
            (uint256, address, address, bytes)
        );
        if (_amount > _gasFeeAmountForReturn) {
            _sayHelloBack(sourceChain, sourceContract, originalPayload, tokenSymbol, _gasFeeAmountForReturn, _refundAddress);
        }
        _otherCallback(
            originalPayload,
            (_amount > _gasFeeAmountForReturn) ? (_amount - _gasFeeAmountForReturn) : _amount,
            tokenSymbol,
            _finalTokenRecipients
        );
    }
}
