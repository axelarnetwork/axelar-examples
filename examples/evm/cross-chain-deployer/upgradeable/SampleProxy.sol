// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import { Proxy } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/upgradable/Proxy.sol';

contract SampleProxy is Proxy {
    constructor(address implementationAddress, address owner, bytes memory setupParams) Proxy(implementationAddress, owner, setupParams) {
        if (_IMPLEMENTATION_SLOT != bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)) revert('invalid implementation slot');

        if (_OWNER_SLOT != keccak256('owner')) revert('invalid owner slot');
    }

    function contractId() internal pure override returns (bytes32) {
        return keccak256('test');
    }
}
