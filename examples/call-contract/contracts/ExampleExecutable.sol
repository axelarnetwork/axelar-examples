// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import {IAxelarExecutable} from "@axelar-network/axelar-cgp-solidity/src/interfaces/IAxelarExecutable.sol";

contract GatewayCaller is IAxelarExecutable {
    string public message;

    constructor(address _gateway) IAxelarExecutable(_gateway) {}

    function _execute(
        string memory,
        string memory,
        bytes calldata payload
    ) internal override {
        string memory _message = abi.decode(payload, (string));
        message = _message;
    }
}
