// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import {BaseProxy} from "@axelar-network/axelar-gmp-sdk-solidity/contracts/upgradable/BaseProxy.sol";

contract ExampleProxy is BaseProxy {
    function contractId()
        internal
        pure
        override
        returns (bytes32)
    {
        return keccak256("example");
    }
}
