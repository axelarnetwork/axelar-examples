// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';
import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';
import { IDeployer } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IDeployer.sol';
import { IUpgradable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IUpgradable.sol';
import { SampleProxy } from './SampleProxy.sol';

import { SampleImplementation } from './SampleImplementation.sol';

struct RemoteChains {
    string destinationChain;
    string destinationAddress;
    uint256 gas;
}

contract CrossChainUpgradeableContractDeployer is AxelarExecutable {
    IAxelarGasService public immutable gasService;
    IDeployer public immutable create3Deployer;
    enum Command {
        Deploy,
        Upgrade
    }
    mapping(address => address) public owners;

    event Executed(address indexed _owner, address indexed _deployedImplementationAddress, address indexed _deployedProxyAddress);
    event Upgraded(address indexed _deployedImplementationAddress);

    constructor(address gateway_, address gasReceiver_, address create3Deployer_) AxelarExecutable(gateway_) {
        gasService = IAxelarGasService(gasReceiver_);
        create3Deployer = IDeployer(create3Deployer_);
    }

    /**
     * @notice Modifier that throws an error if called by any account other than the owner.
     */
    modifier onlyProxyOwner(address _proxyAddress) {
        if (owners[_proxyAddress] != msg.sender) revert('not proxy owner');

        _;
    }

    function deployRemoteContracts(
        RemoteChains[] calldata remoteChains,
        bytes calldata implementationBytecode,
        bytes32 salt,
        address owner,
        bytes calldata setupParams
    ) external payable {
        require(msg.value > 0, 'Gas payment is required');

        bytes memory payload = abi.encode(Command.Deploy, implementationBytecode, salt, owner, setupParams);

        _fanOut(remoteChains, payload);
    }

    function upgradeRemoteContracts(
        RemoteChains[] calldata remoteChains,
        address proxyAddress,
        address newImplementation,
        bytes32 newImplementationCodeHash,
        bytes calldata setupParams
    ) external payable {
        require(msg.value > 0, 'Gas payment is required');

        bytes memory payload = abi.encode(Command.Upgrade, proxyAddress, newImplementation, newImplementationCodeHash, setupParams);

        _fanOut(remoteChains, payload);
    }

    function _fanOut(RemoteChains[] calldata remoteChains, bytes memory payload) internal {
        for (uint256 i = 0; i < remoteChains.length; i++) {
            if (remoteChains[i].gas > 0) {
                gasService.payNativeGasForContractCall{ value: remoteChains[i].gas }(
                    address(this),
                    remoteChains[i].destinationChain,
                    remoteChains[i].destinationAddress,
                    payload,
                    msg.sender
                );
            }
            gateway.callContract(remoteChains[i].destinationChain, remoteChains[i].destinationAddress, payload);
        }
    }

    function upgrade(
        address proxyAddress,
        address newImplementation,
        bytes32 newImplementationCodeHash,
        bytes memory params
    ) external onlyProxyOwner(proxyAddress) {
        _upgrade(proxyAddress, newImplementation, newImplementationCodeHash, params);
    }

    function _upgrade(address proxyAddress, address newImplementation, bytes32 newImplementationCodeHash, bytes memory params) internal {
        IUpgradable(proxyAddress).upgrade(newImplementation, newImplementationCodeHash, params);
        emit Upgraded(SampleImplementation(proxyAddress).implementation());
    }

    function _deploy(bytes memory implementationBytecode, bytes32 salt, bytes memory setupParams, address owner) internal {
        address deployedImplementationAddress = _deployImplementation(salt, implementationBytecode);
        address deployedProxyAddress = _deployProxy(deployedImplementationAddress, address(this), setupParams);
        owners[deployedProxyAddress] = owner;
        emit Executed(owner, deployedImplementationAddress, deployedProxyAddress);
    }

    function _deployImplementation(bytes32 deploySalt, bytes memory implementationBytecode) internal returns (address) {
        if (implementationBytecode.length == 0) revert('empty bytecode');

        address implementation;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            implementation := create2(0, add(implementationBytecode, 32), mload(implementationBytecode), deploySalt)
        }

        if (implementation == address(0)) revert('failed to deploy');

        return implementation;
    }

    function _deployProxy(
        address implementationAddress,
        address owner,
        bytes memory setupParams
    ) internal returns (address deployedProxyAddress) {
        return address(new SampleProxy(implementationAddress, owner, setupParams));
    }

    function _execute(string calldata, string calldata, bytes calldata payload_) internal override {
        Command command = abi.decode(payload_, (Command));

        if (command == Command.Deploy) {
            (, bytes memory implementationBytecode, bytes32 salt, address owner, bytes memory setupParams) = abi.decode(
                payload_,
                (Command, bytes, bytes32, address, bytes)
            );
            _deploy(implementationBytecode, salt, setupParams, owner);
        } else if (command == Command.Upgrade) {
            (, address proxyAddress, address newImplementation, bytes32 newImplementationCodeHash, bytes memory setupParams) = abi.decode(
                payload_,
                (Command, address, address, bytes32, bytes)
            );
            _upgrade(proxyAddress, newImplementation, newImplementationCodeHash, setupParams);
        } else {
            revert('invalid command');
        }
    }
}
