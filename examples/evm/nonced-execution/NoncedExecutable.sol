// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import { Upgradable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/upgradable/Upgradable.sol';
import { StringToAddress } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/utils/AddressString.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';

abstract contract NoncedExecutable is AxelarExecutable {
    using StringToAddress for string;

    error IncorrectNonce();
    error AlreadyInitialized();
    error WrongSourceAddress(string sourceAddress);

    mapping(string => mapping(address => uint256)) public incomingNonces;
    mapping(string => mapping(address => uint256)) public outgoingNonces;
    string public executableContract;
    IAxelarGasService public gasReceiver;

    constructor(address _gateway, address _gasReciever) AxelarExecutable(_gateway) {
        gasReceiver = IAxelarGasService(_gasReciever);
    }

    function sendContractCall(string calldata destinationChain, string calldata destinationContract, bytes calldata payload) external payable {
        bytes memory newPayload = abi.encode(outgoingNonces[destinationChain][address(this)]++, address(this), payload);
        if (msg.value > 0) {
            gasReceiver.payNativeGasForContractCall{ value: msg.value }(
                address(this),
                destinationChain,
                destinationContract,
                newPayload,
                msg.sender
            );
        }
        gateway.callContract(destinationChain, destinationContract, newPayload);
    }

    function _execute(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal override {
        (uint256 nonce, address sender, bytes memory newPayload) = abi.decode(payload, (uint256, address, bytes));
        if (nonce != incomingNonces[sourceChain][sender]++) revert IncorrectNonce();
        gateway.callContract(sourceChain, sourceAddress, abi.encode(nonce));
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
