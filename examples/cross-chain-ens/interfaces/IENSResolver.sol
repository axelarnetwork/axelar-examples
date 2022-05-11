// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

abstract contract IENSResolver {
    function addr(bytes32 node) public view virtual returns (address);
}
