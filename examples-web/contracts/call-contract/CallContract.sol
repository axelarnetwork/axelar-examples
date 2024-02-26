// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';
import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';

/**
 * @title CallContract
 * @notice Send a message from chain A to chain B and stores gmp message */
contract CallContract is AxelarExecutable {

    string public message;

    string public sourceChain;
    string public sourceAddress;
    IAxelarGasService public immutable gasService;

    event Executed(string _from, string _message);

    /**
     * 
     * @param _gateway address of axl gateway on deployed chain
     * @param _gasReceiver address of axl gas service on deployed chain
     */
    constructor(address _gateway, address _gasReceiver) AxelarExecutable(_gateway) {
        gasService = IAxelarGasService(_gasReceiver);
    }

    /**
     * @notice Send message from chain A to chain B
     * @dev message param is passed in as gmp message
     * @param destinationChain name of the dest chain (ex. "Fantom")
     * @param destinationAddress address on dest chain this tx is going to
     * @param _message message to be sent
     */
    function sendInterchainMessage(
        string calldata destinationChain,
        string calldata destinationAddress,
        string calldata _message
    ) external payable {
        require(msg.value > 0, 'Gas payment is required');

        bytes memory payload = abi.encode(_message);
        gasService.payNativeGasForContractCall{ value: msg.value }(
            address(this),
            destinationChain,
            destinationAddress,
            payload,
            msg.sender
        );
        gateway.callContract(destinationChain, destinationAddress, payload);
    }

    /**
     * @notice logic to be executed on dest chain
     * @dev this is triggered automatically by relayer
     * @param _sourceChain blockchain where tx is originating from 
     * @param _sourceAddress address on src chain where tx is originating from
     * @param _payload encoded gmp message sent from src chain
     */
    function _execute(
        string calldata _sourceChain,
        string calldata _sourceAddress,
        bytes calldata _payload
    ) internal override {
        (message) = abi.decode(_payload, (string));
        sourceChain = _sourceChain;
        sourceAddress = _sourceAddress;

        emit Executed(sourceAddress, message);

    }
}
