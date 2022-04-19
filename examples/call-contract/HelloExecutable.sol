// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import {IAxelarExecutable} from "@axelar-network/axelar-cgp-solidity/src/interfaces/IAxelarExecutable.sol";
import {AxelarGasReceiver} from "@axelar-network/axelar-cgp-solidity/src/gas-receiver/AxelarGasReceiver.sol";

contract HelloExecutable is IAxelarExecutable {
    string public message;
    string public sourceChain;
    string public sourceAddress;
    uint256 public value;
    AxelarGasReceiver gasReceiver;

    constructor(address _gateway, address _gasReceiver)
        IAxelarExecutable(_gateway)
    {
        gasReceiver = AxelarGasReceiver(_gasReceiver);
    }

    function payGasAndCallContract(
        string memory destinationChain,
        string memory destinationAddress,
        bytes calldata payload
    ) external payable {
        gasReceiver.payNativeGasForContractCall{value: msg.value}(
            destinationChain,
            destinationAddress,
            payload
        );
        gateway.callContract(destinationChain, destinationAddress, payload);
    }

    function _execute(
        string memory _sourceChain,
        string memory _sourceAddress,
        bytes calldata payload
    ) internal override {
        string memory _message = abi.decode(payload, (string));
        message = _message;
        sourceChain = _sourceChain;
        sourceAddress = _sourceAddress;
    }
}
