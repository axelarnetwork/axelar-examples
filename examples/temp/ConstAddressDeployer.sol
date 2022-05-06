// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

contract ConstAddressDeployer {
    event Deployed(bytes32 bytecodeHash, bytes32 salt, address deployedAddress);
    function deploy(bytes memory bytecode, bytes32 salt) external returns (address deployedAddress) {
        // solhint-disable-next-line no-inline-assembly
        assembly {
            deployedAddress := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        emit Deployed(keccak256(bytecode), salt, deployedAddress);
    }

    function predict(bytes memory bytecode, bytes32 salt) external view returns (address deployedAddress) {
        deployedAddress = address(uint160(uint256(keccak256(abi.encodePacked(
            hex'ff',
            address(this),
            salt,
            keccak256(bytecode) // init code hash
        )))));
    }
}
