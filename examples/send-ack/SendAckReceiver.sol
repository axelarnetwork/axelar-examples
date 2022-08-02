// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import { AxelarExecutable } from '@axelar-network/axelar-utils-solidity/contracts/executables/AxelarExecutable.sol';
import { IAxelarGateway } from '@axelar-network/axelar-utils-solidity/contracts/interfaces/IAxelarGateway.sol';

abstract contract SendAckReceiver is AxelarExecutable {
    function _execute(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal override {
        (uint256 nonce, bytes memory payloadActual) = abi.decode(payload, (uint256, bytes));
        gateway().callContract(sourceChain, sourceAddress, abi.encode(nonce));
        _executePostAck(sourceChain, sourceAddress, payloadActual);
    }

    // override this to do stuff
    function _executePostAck(
        string memory sourceChain,
        string memory sourceAddress,
        bytes memory payload
    ) internal virtual;
}
