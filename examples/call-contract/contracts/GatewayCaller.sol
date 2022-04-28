// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import {IAxelarExecutable} from "@axelar-network/axelar-cgp-solidity/src/interfaces/IAxelarExecutable.sol";
import {IAxelarGasReceiver} from "@axelar-network/axelar-cgp-solidity/src/interfaces/IAxelarGasReceiver.sol";
import {IAxelarGateway} from "@axelar-network/axelar-cgp-solidity/src/interfaces/IAxelarGateway.sol";

contract GatewayCaller {
    string public message;
    string public sourceChain;
    string public sourceAddress;
    IAxelarGasReceiver gasReceiver;
    IAxelarGateway gateway;

    constructor(address _gateway, address _gasReceiver) {
        gateway = IAxelarGateway(_gateway);
        gasReceiver = IAxelarGasReceiver(_gasReceiver);
    }

    function payGasAndCallContract(
        string memory destinationChain,
        string memory destinationAddress,
        bytes calldata payload
    ) external payable {
        gasReceiver.payNativeGasForContractCall{value: msg.value}(
            msg.sender,
            destinationChain,
            destinationAddress,
            payload,
            msg.sender
        );
        gateway.callContract(destinationChain, destinationAddress, payload);
    }
}
