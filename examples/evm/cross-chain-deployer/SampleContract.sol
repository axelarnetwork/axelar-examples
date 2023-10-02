// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract SampleContract {
    string public value;

    function setValue(string calldata value_) external {
        value = value_;
    }
}
