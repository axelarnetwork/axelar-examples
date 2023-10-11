// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';
import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';
import { IDeployer } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IDeployer.sol';
import { StringToAddress, AddressToString } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/libs/AddressString.sol';
import { SampleProxy } from './SampleProxy.sol';

struct RemoteChains {
    string destinationChain;
    string destinationAddress;
    uint256 gas;
}

contract CrossChainUpgradeableContractDeployer is AxelarExecutable {
    using AddressToString for address;
    IAxelarGasService public immutable gasService;
    IDeployer public immutable create3Deployer;

    event Executed(address indexed _from, address indexed _owner, address indexed _deployedImplementationAddress);

    constructor(address gateway_, address gasReceiver_, address create3Deployer_) AxelarExecutable(gateway_) {
        gasService = IAxelarGasService(gasReceiver_);
        create3Deployer = IDeployer(create3Deployer_);
    }

    function deployRemoteContracts(
        RemoteChains[] calldata remoteChains,
        bytes calldata implementationBytecode,
        bytes32 salt,
        address owner,
        bytes calldata setupParams
    ) external payable {
        require(msg.value > 0, 'Gas payment is required');

        bytes memory payload = abi.encode(implementationBytecode, salt, owner, setupParams);

        for (uint256 i = 0; i < remoteChains.length; i++) {
            _deployRemoteContract(remoteChains[i].destinationChain, remoteChains[i].destinationAddress, remoteChains[i].gas, payload);
        }
    }

    function _deployRemoteContract(
        string calldata destinationChain,
        string calldata destinationAddress,
        uint256 gas,
        bytes memory payload
    ) internal {
        if (gas > 0) {
            gasService.payNativeGasForContractCall{ value: gas }(address(this), destinationChain, destinationAddress, payload, msg.sender);
        }

        gateway.callContract(destinationChain, destinationAddress, payload);
    }

    function _execute(string calldata, string calldata, bytes calldata payload_) internal override {
        (bytes memory implementationBytecode, bytes32 salt, address owner, bytes memory setupParams) = abi.decode(
            payload_,
            (bytes, bytes32, address, bytes)
        );

        address deployedImplementationAddress = _deployExecutable(salt, implementationBytecode, owner, setupParams);
        emit Executed(msg.sender, address(this), deployedImplementationAddress);
    }

    function _deployExecutable(
        bytes32 deploySalt,
        bytes memory implementationBytecode,
        address owner,
        bytes memory setupParams
    ) internal returns (address) {
        if (implementationBytecode.length == 0) revert('empty bytecode');

        address implementation;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            implementation := create2(0, add(implementationBytecode, 32), mload(implementationBytecode), deploySalt)
        }

        if (implementation == address(0)) revert('failed to deploy');

        return _deployProxy(implementation, owner, setupParams);
    }

    function _deployProxy(
        address implementationAddress,
        address owner,
        bytes memory setupParams
    ) internal returns (address deployedProxyAddress) {
        SampleProxy proxy = new SampleProxy(implementationAddress, owner, setupParams);
        return proxy.implementation();
    }
}
