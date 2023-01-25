// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executables/AxelarExecutable.sol';
import { Upgradable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/upgradables/Upgradable.sol';
import { StringToAddress } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/StringAddressUtils.sol';

abstract contract NoncedExecutable is AxelarExecutable, Upgradable {
    using StringToAddress for string;

    error IncorrectNonce();
    error AlreadyInitialized();
    error WrongSourceAddress(string sourceAddress);

    mapping(string => mapping(address => uint256)) public incomingNonces;
    address public senderContract;

    constructor(address gateway_) AxelarExecutable(gateway_) {}

    function _setup(bytes calldata params) internal override {
        address senderContract_ = abi.decode(params, (address));
        if (senderContract != address(0)) revert AlreadyInitialized();
        senderContract = senderContract_;
    }

    function _execute(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal override {
        if (sourceAddress.toAddress() != senderContract) {
            revert WrongSourceAddress(sourceAddress);
        }
        (uint256 nonce, address sender, bytes memory newPayload) = abi.decode(payload, (uint256, address, bytes));
        if (nonce != incomingNonces[sourceChain][sender]++) revert IncorrectNonce();
        gateway.callContract(sourceChain, sourceAddress, abi.encode(nonce));
        _executeNonced(sourceChain, sender, nonce, newPayload);
    }

    function _executeWithToken(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload,
        string calldata tokenSymbol,
        uint256 amount
    ) internal override {
        if (sourceAddress.toAddress() != senderContract) {
            revert WrongSourceAddress(sourceAddress);
        }
        (uint256 nonce, address sender, bytes memory newPayload) = abi.decode(payload, (uint256, address, bytes));
        if (nonce != incomingNonces[sourceChain][sender]++) revert IncorrectNonce();
        _executeNoncedWithToken(sourceChain, sender, nonce, newPayload, tokenSymbol, amount);
    }

    // Override these.
    function _executeNonced(
        string calldata sourceChain,
        address sourceAddress,
        uint256 nonce,
        bytes memory payload
    ) internal virtual {}

    function _executeNoncedWithToken(
        string calldata sourceChain,
        address sourceAddress,
        uint256 nonce,
        bytes memory payload,
        string calldata tokenSymbol,
        uint256 amount
    ) internal virtual {}

    function contractId() external pure returns (bytes32) {
        return keccak256('example');
    }
}
