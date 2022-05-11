// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "./IENSResolver.sol";

abstract contract IENS {
    function resolver(bytes32 node) public view virtual returns (IENSResolver);
}
