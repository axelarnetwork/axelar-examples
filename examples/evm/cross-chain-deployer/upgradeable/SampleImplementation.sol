// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import { Upgradable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/upgradable/Upgradable.sol';

contract SampleImplementation is Upgradable {
    uint256 public num;

    constructor() Upgradable() {
        if (_IMPLEMENTATION_SLOT != bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)) {
            revert('invalid implementation slot');
        }
    }

    function _setup(bytes calldata data) internal override {
        num = abi.decode(data, (uint256));
    }

    function contractId() external pure override returns (bytes32) {
        return keccak256('test');
    }
}
