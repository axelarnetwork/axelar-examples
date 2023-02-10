// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import {Proxy} from "@axelar-network/axelar-gmp-sdk-solidity/contracts/upgradable/Proxy.sol";

contract ExampleProxy is Proxy {
    function contractId()
        internal
        pure
        override
        returns (bytes32)
    {
        return keccak256("example");
    }
}
