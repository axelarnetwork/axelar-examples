// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import { Upgradable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/upgradable/Upgradable.sol';
import { StringToAddress } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/libs/AddressString.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';

abstract contract NoncedExecutable is AxelarExecutable {
    using StringToAddress for string;

    error IncorrectNonce();
    error AlreadyInitialized();
    error WrongSourceAddress(string sourceAddress);

    // Nonces are stored per chain and per address.
    // This is the address that will receive the GMP message.
    mapping(string => mapping(address => uint256)) public incomingNonces;

    // This is the address that will send the GMP message.
    mapping(string => mapping(address => uint256)) public outgoingNonces;

    IAxelarGasService public gasReceiver;

    constructor(address _gateway, address _gasReciever) AxelarExecutable(_gateway) {
        gasReceiver = IAxelarGasService(_gasReciever);
    }

    /**
    * @dev Send a contract call to a contract on another chain.
    * @param destinationChain The chain to send the contract call to.
    * @param destinationContract The address of the contract to call.
    * @param payload The payload to send to the contract.
     */
    function sendContractCall(string calldata destinationChain, string calldata destinationContract, bytes calldata payload) external payable {
        require(msg.value > 0, 'Gas payment is required');


        // Build the payload. The first 32 bytes are the nonce, the next 32 bytes are the address of the sender, and the rest is the payload passed by the caller.
        bytes memory newPayload = abi.encode(outgoingNonces[destinationChain][address(this)], address(this), payload);

        // Increment the nonce.
        outgoingNonces[destinationChain][address(this)]++;

        // Pay gas for the contract call.
        gasReceiver.payNativeGasForContractCall{ value: msg.value }(
            address(this),
            destinationChain,
            destinationContract,
            newPayload,
            msg.sender
        );

        // Send the call to AxelarGateway.
        gateway.callContract(destinationChain, destinationContract, newPayload);
    }

    function _execute(
        string calldata sourceChain,
        string calldata,
        bytes calldata payload
    ) internal override {
        // Decode the payload. The first 32 bytes are the nonce, the next 32 bytes are the address of the sender, and the rest is the payload passed by the sender.
        (uint256 nonce, address sender, bytes memory newPayload) = abi.decode(payload, (uint256, address, bytes));

        // Check the nonce. If it's not the expected one, revert.
        if (nonce != incomingNonces[sourceChain][sender]) revert IncorrectNonce();

        // Increment the nonce.
        incomingNonces[sourceChain][sender]++;

        // Run `_executeNonced` function which is implemented by the child contract (ExecutableImplementation.sol).
        _executeNonced(sourceChain, sender, nonce, newPayload);
    }

    // Override these.
    function _executeNonced(
        string calldata sourceChain,
        address sourceAddress,
        uint256 nonce,
        bytes memory payload
    ) internal virtual {}
}
