// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

contract StorageMap {
    function getStorageKey(address sender, bytes32 key) public pure returns (bytes32) {
        return keccak256(abi.encode(sender, key));
    }

    function set(bytes32 key, bytes32 value) external {
        bytes32 storageKey = getStorageKey(msg.sender, key);
        assembly {
            sstore(storageKey, value)
        }
    }

    function get(bytes32 key) external view returns (bytes32) {
        return getForSender(msg.sender, key);
    }

    function getForSender(address sender, bytes32 key) public view returns(bytes32 value) {
        bytes32 storageKey = getStorageKey(sender, key);
        assembly {
            value := sload(storageKey)
        }
    }
}