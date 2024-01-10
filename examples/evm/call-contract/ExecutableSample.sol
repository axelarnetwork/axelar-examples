// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';
import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';

contract ExecutableSample is AxelarExecutable {
    string public value;
    string public sourceChain;
    string public sourceAddress;
    IAxelarGasService public immutable gasService;

    constructor(address gateway_, address gasReceiver_) AxelarExecutable(gateway_) {
        gasService = IAxelarGasService(gasReceiver_);
    }

    // Call this function to update the value of this contract along with all its siblings'.
    function setRemoteValue(string calldata destinationChain, string calldata destinationAddress, string calldata value_) external payable {

        bytes memory payload = abi.encode(value_);
        gateway.callContract(destinationChain, destinationAddress, payload);
    }

    function many(
        string calldata destinationChain,
        string calldata destinationAddress,
        string calldata value_,
        uint num
    ) external payable {

        bytes memory payload = abi.encode(value_);
        for (uint i = 0; i < num; i++) {
            gateway.callContract(destinationChain, destinationAddress, payload);
        }
    }

    function dummyCall(
        string calldata destinationChain,
        string calldata destinationAddress,
        string calldata value_
    ) external payable {

    }

    // Handles calls created by setAndSend. Updates this contract's value
    function _execute(string calldata sourceChain_, string calldata sourceAddress_, bytes calldata payload_) internal override {
        (value) = abi.decode(payload_, (string));
        sourceChain = sourceChain_;
        sourceAddress = sourceAddress_;
    }
}
