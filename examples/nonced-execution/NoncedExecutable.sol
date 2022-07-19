// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import { IAxelarGateway } from '@axelar-network/axelar-cgp-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IAxelarExecutable } from '@axelar-network/axelar-cgp-solidity/contracts/interfaces/IAxelarExecutable.sol';
import { StringToAddress } from '@axelar-network/axelar-utils-solidity/contracts/StringAddressUtils.sol';

abstract contract NoncedExecutable is IAxelarExecutable {
    using StringToAddress for string;

    error IncorrectNonce();
    error AlreadyInitialized();

    event WrongSourceAddress(string sourceAddress);

    mapping(string => mapping(address => uint256)) public incomingNonces;
    address public senderContract;

    constructor() IAxelarExecutable(address(0)) {}

    function init(address gateway_, address senderContract_) external virtual {
        if (address(gateway) != address(0) || senderContract != address(0)) revert AlreadyInitialized();
        senderContract = senderContract_;
        gateway = IAxelarGateway(gateway_);
    }

    function _execute(
        string memory sourceChain,
        string memory sourceAddress,
        bytes calldata payload
    ) internal override {
        if (sourceAddress.toAddress() != senderContract) {
            emit WrongSourceAddress(sourceAddress);
            return;
        }
        (uint256 nonce, address sender, bytes memory newPayload) = abi.decode(payload, (uint256, address, bytes));
        if (nonce != incomingNonces[sourceChain][sender]++) revert IncorrectNonce();
        gateway.callContract(sourceChain, sourceAddress, abi.encode(nonce));
        _executeNonced(sourceChain, sender, nonce, newPayload);
    }

    function _executeWithToken(
        string memory sourceChain,
        string memory sourceAddress,
        bytes calldata payload,
        string memory tokenSymbol,
        uint256 amount
    ) internal override {
        if (sourceAddress.toAddress() != senderContract) {
            emit WrongSourceAddress(sourceAddress);
            return;
        }
        (uint256 nonce, address sender, bytes memory newPayload) = abi.decode(payload, (uint256, address, bytes));
        if (nonce != incomingNonces[sourceChain][sender]++) revert IncorrectNonce();
        _executeNoncedWithToken(sourceChain, sender, nonce, newPayload, tokenSymbol, amount);
    }

    // Override these.
    function _executeNonced(
        string memory sourceChain,
        address sourceAddress,
        uint256 nonce,
        bytes memory payload
    ) internal virtual {}

    function _executeNoncedWithToken(
        string memory sourceChain,
        address sourceAddress,
        uint256 nonce,
        bytes memory payload,
        string memory tokenSymbol,
        uint256 amount
    ) internal virtual {}
}
