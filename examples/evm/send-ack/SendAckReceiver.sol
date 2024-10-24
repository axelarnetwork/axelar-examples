// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';

contract SendAckReceiver is AxelarExecutable {
    constructor(address gateway_) AxelarExecutable(gateway_) {}

    function _execute(
        bytes32 /*commandId*/,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal override {
        (uint256 nonce, bytes memory payloadActual) = abi.decode(payload, (uint256, bytes));
        gateway().callContract(sourceChain, sourceAddress, abi.encode(nonce));
        _executePostAck(sourceChain, sourceAddress, payloadActual);
    }

    // override this to do stuff
    function _executePostAck(string memory sourceChain, string memory sourceAddress, bytes memory payload) internal virtual {}
}
