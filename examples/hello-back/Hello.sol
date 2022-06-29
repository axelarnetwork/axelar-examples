//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import { IAxelarExecutable } from '@axelar-network/axelar-cgp-solidity/contracts/interfaces/IAxelarExecutable.sol';
import { IERC20 } from '@axelar-network/axelar-cgp-solidity/contracts/interfaces/IERC20.sol';
import { IAxelarGasService } from '@axelar-network/axelar-cgp-solidity/contracts/interfaces/IAxelarGasService.sol';

contract Hello is IAxelarExecutable {
    string public message;
    string public sourceChain;
    string public sourceAddress;
    IAxelarGasService gasReceiver;

    constructor(address _gateway, address _gasReceiver) IAxelarExecutable(_gateway) {
        gasReceiver = IAxelarGasService(_gasReceiver);
    }

    function sayHello(
        string memory destinationChain,
        string memory destinationAddress,
        bytes calldata payload,
        string memory symbol,
        uint256 amount,
        address finalTokenRecipient,
        uint256 gasFeeAmount,
        uint256 gasFeeAmountForReturn
    ) external {
        address tokenAddress = gateway.tokenAddresses(symbol);
        address _refundAddress = msg.sender;
        IERC20(tokenAddress).transferFrom(_refundAddress, address(this), amount);
        IERC20(tokenAddress).approve(address(gateway), amount - gasFeeAmount);
        IERC20(tokenAddress).approve(address(gasReceiver), gasFeeAmount);

        bytes memory wrappedPayload = abi.encode(gasFeeAmountForReturn, _refundAddress, finalTokenRecipient, payload);

        if (amount > gasFeeAmount) {
            gasReceiver.payGasForContractCallWithToken(
                address(this),
                destinationChain,
                destinationAddress,
                wrappedPayload,
                symbol,
                amount - gasFeeAmount,
                tokenAddress,
                gasFeeAmount,
                _refundAddress
            );
        }

        gateway.callContractWithToken(
            destinationChain,
            destinationAddress,
            wrappedPayload,
            symbol,
            amount > gasFeeAmount ? amount - gasFeeAmount : amount
        );
    }

    function _execute(
        string memory _sourceChain,
        string memory _sourceAddress,
        bytes calldata payload
    ) internal override {
        (message) = abi.decode(payload, (string));
        sourceChain = _sourceChain;
        sourceAddress = _sourceAddress;
    }
}
