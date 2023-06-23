// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { NoncedExecutable } from './NoncedExecutable.sol';

contract ExecutableImplementation is NoncedExecutable {
    mapping(string => mapping(address => mapping(uint256 => string))) public messages;

    constructor(address gateway_, address gasService_) NoncedExecutable(gateway_, gasService_) {}

    function _executeNonced(
        string calldata sourceChain,
        address sourceAddress,
        uint256 nonce,
        bytes memory payload
    ) internal override {
        string memory message = abi.decode(payload, (string));
        messages[sourceChain][sourceAddress][nonce] = message;
    }
}
