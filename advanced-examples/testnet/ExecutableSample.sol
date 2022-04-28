// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import { IAxelarExecutable } from '@axelar-network/axelar-cgp-solidity/src/interfaces/IAxelarExecutable.sol';
import { AxelarGasReceiver } from '@axelar-network/axelar-cgp-solidity/src/gas-receiver/AxelarGasReceiver.sol';
import { IERC20 } from '@axelar-network/axelar-cgp-solidity/src/interfaces/IERC20.sol';

contract ExecutableSample is IAxelarExecutable {
    string public value;
    string public sourceChain;
    string public sourceAddress;
    AxelarGasReceiver gasReceiver;
    

    constructor(address gateway_, address gasReceiver_) IAxelarExecutable(gateway_) {
        gasReceiver = AxelarGasReceiver(gasReceiver_);
    }

    //Call this function to update the value of this contract along with all its siblings'.
    function setRemoteValue(
        string memory destinationChain,
        string memory destinationAddress,
        string calldata value_
    ) external payable {
        bytes memory payload = abi.encode(value_);
        if(msg.value > 0) {
            gasReceiver.payNativeGasForContractCall{ value: msg.value }(
                address(this),
                destinationChain,
                destinationAddress,
                payload,
                msg.sender
            );
        }
        gateway.callContract(
            destinationChain,
            destinationAddress,
            payload
        );
    }

    /*Handles calls created by setAndSend. Updates this contract's value 
    and gives the token received to the destination specified at the source chain. */
    function _execute(
        string memory sourceChain_,
        string memory sourceAddress_, 
        bytes calldata payload_
    ) internal override {
        (value) = abi.decode(payload_, (string));
        sourceChain = sourceChain_;
        sourceAddress = sourceAddress_;
    }
}