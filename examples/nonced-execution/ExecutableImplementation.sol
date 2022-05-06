// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import { NoncedExecutable } from './NoncedExecutable.sol';
import { AddressFormat } from '@axelar-network/axelar-cgp-solidity/src/util/AddressFormat.sol';

contract ExecutableImplementation is NoncedExecutable {
    using AddressFormat for address;

    mapping(string => mapping(address => mapping(uint256 => string))) public messages;
    // Override these.
    function _executeNonced(
        string memory sourceChain,
        address sourceAddress,
        uint256 nonce,
        bytes memory payload
    ) internal override {
        string memory message = abi.decode(payload, (string));
        messages[sourceChain][sourceAddress][nonce] = message;
    }
}