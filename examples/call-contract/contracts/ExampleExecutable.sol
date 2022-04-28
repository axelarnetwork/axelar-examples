// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import {IAxelarExecutable} from "@axelar-network/axelar-cgp-solidity/src/interfaces/IAxelarExecutable.sol";

contract ExampleExecutable is IAxelarExecutable {
    string public message;

    event Executed(bytes32 indexed traceId);

    constructor(address _gateway) IAxelarExecutable(_gateway) {}

    function _execute(
        string memory,
        string memory,
        bytes calldata payload
    ) internal override {
        (bytes32 traceId, string memory _message) = abi.decode(
            payload,
            (bytes32, string)
        );
        message = _message;

        emit Executed(traceId);
    }
}
