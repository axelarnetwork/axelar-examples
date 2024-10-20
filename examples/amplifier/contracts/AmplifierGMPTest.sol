// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';

/**
 * @title AmplifierGMPTest
 * @notice Send a message from chain A to chain B and stores gmp message
 */
contract AmplifierGMPTest is AxelarExecutable {
    string public message;
    string public sourceChain;
    string public sourceAddress;

    constructor(address _gateway) AxelarExecutable(_gateway) {}

    /**
     * @notice Send message from chain A to chain B
     * @dev message param is passed in as gmp message
     * @param destinationChain name of the dest chain (ex. "Fantom")
     * @param destinationAddress address on dest chain this tx is going to
     * @param _message message to be sent
     */
    function setRemoteValue(string calldata destinationChain, string calldata destinationAddress, string calldata _message) external {
        bytes memory payload = abi.encode(_message);
        gateway().callContract(destinationChain, destinationAddress, payload);
    }

    /**
     * @notice logic to be executed on dest chain
     * @dev this is triggered automatically by relayer
     * @param _sourceChain blockchain where tx is originating from
     * @param _sourceAddress address on src chain where tx is originating from
     * @param _payload encoded gmp message sent from src chain
     */
    function _execute(
        bytes32 /*commandId*/,
        string calldata _sourceChain,
        string calldata _sourceAddress,
        bytes calldata _payload
    ) internal virtual override {
        (message) = abi.decode(_payload, (string));
        sourceChain = _sourceChain;
        sourceAddress = _sourceAddress;
    }
}
