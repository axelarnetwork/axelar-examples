// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {InitProxy} from '@axelar-network/axelar-gmp-sdk-solidity/contracts/upgradable/InitProxy.sol';

contract ERC20CrossChainProxy is InitProxy {
    function contractId()
        internal
        pure
        override
        returns (bytes32)
    {
        return keccak256('erc20-crosschain');
    }
}
