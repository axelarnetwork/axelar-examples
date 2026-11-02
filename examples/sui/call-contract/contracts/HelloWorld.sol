//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';

/**
 * @title HelloWorld
 * @notice Relays a string between an EVM chain and a Sui Move package.
 */
contract HelloWorld is AxelarExecutable {
    string public value;
    string public sourceChain;
    string public sourceAddress;
    IAxelarGasService public immutable gasService;

    event Executed(bytes32 commandId, string _from, string _message);

    constructor(address _gateway, address _gasReceiver) AxelarExecutable(_gateway) {
        gasService = IAxelarGasService(_gasReceiver);
    }

    /**
     * Sends `message` to a package on Sui.
     * @param destinationChain 'sui' for the local Sui network. The relayer matches this
     * name in lowercase, so pass it lowercase.
     * @param destinationAddress the Channel object address of the destination package, NOT
     * its package id. The Sui gateway routes an approved message to a Channel, and the
     * relayer asks RelayerDiscovery how to consume it from there.
     */
    function setRemoteValue(
        string calldata destinationChain,
        string calldata destinationAddress,
        string calldata message
    ) external payable {
        require(msg.value > 0, 'Gas payment is required');

        bytes memory payload = abi.encode(message);
        gasService.payNativeGasForContractCall{ value: msg.value }(
            address(this),
            destinationChain,
            destinationAddress,
            payload,
            msg.sender
        );
        gateway().callContract(destinationChain, destinationAddress, payload);
    }

    // Handles calls created by setRemoteValue on the Sui side. Updates this contract's value.
    function _execute(
        bytes32 commandId,
        string calldata sourceChain_,
        string calldata sourceAddress_,
        bytes calldata payload_
    ) internal override {
        // Demo only — this shouldn't be used as-is in production: AxelarExecutable proves Axelar
        // delivered the message but not who sent it. Validate sourceChain/sourceAddress against a
        // trusted sender before acting on the message.
        //
        // On Sui the sender needs a second look: sourceAddress is the sending package's Channel
        // object address, and a shared Channel can be used by any Sui account. Allowlisting one
        // therefore trusts every account that can reach it, unless that package gates sending.
        (value) = abi.decode(payload_, (string));
        sourceChain = sourceChain_;
        sourceAddress = sourceAddress_;

        emit Executed(commandId, sourceAddress_, value);
    }
}
