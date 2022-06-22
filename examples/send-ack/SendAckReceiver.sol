// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import { IAxelarExecutable } from '@axelar-network/axelar-cgp-solidity/contracts/interfaces/IAxelarExecutable.sol';

abstract contract SendAckReceiver is IAxelarExecutable {
    function _execute(
        string memory sourceChain,
        string memory sourceAddress,
        bytes calldata payload
    ) internal override {
        (uint256 nonce, bytes memory payloadActual) = abi.decode(payload, (uint256, bytes));
        gateway.callContract(sourceChain, sourceAddress, abi.encode(nonce));
        _executePostAck(sourceChain, sourceAddress, payloadActual);
    }

    // override this to do stuff
    function _executePostAck(
        string memory sourceChain,
        string memory sourceAddress,
        bytes memory payload
    ) internal virtual;
}
