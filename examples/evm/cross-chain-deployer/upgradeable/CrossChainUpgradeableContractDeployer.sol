// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import { Create3 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/deploy/Create3.sol';
import { Proxy } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/upgradable/Proxy.sol';
import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';
import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';
import { IDeployer } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IDeployer.sol';
import { IUpgradable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IUpgradable.sol';
import { Ownable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/utils/Ownable.sol';
import { IInterchainDeployer } from './IInterchainDeployer.sol';

contract CrossChainUpgradeableContractDeployer is IInterchainDeployer, AxelarExecutable, Ownable, Create3 {
    IAxelarGasService public immutable gasService;

    mapping(string => mapping(string => bool)) public whitelistedSourceAddresses;

    constructor(address gateway_, address gasService_, address owner_) AxelarExecutable(gateway_) Ownable(owner_) {
        gasService = IAxelarGasService(gasService_);
    }

    function deployStatic(bytes32 userSalt, bytes memory implementationBytecode) external {
        _deployImplementation(keccak256(abi.encode(msg.sender, userSalt)), implementationBytecode);
    }

    function deployUpgradeable(bytes32 userSalt, bytes memory newImplementationBytecode, bytes memory setupParams) external {
        _deployUpgradeable(msg.sender, userSalt, newImplementationBytecode, setupParams, '');
    }

    function upgradeUpgradeable(bytes32 userSalt, bytes memory newImplementationBytecode, bytes memory setupParams) external {
        _upgradeUpgradeable(msg.sender, userSalt, newImplementationBytecode, setupParams, '');
    }

    function deployRemoteContracts(
        RemoteChains[] calldata remoteChains,
        bytes calldata implementationBytecode,
        bytes32 userSalt,
        bytes calldata setupParams
    ) external payable {
        require(msg.value > 0, 'Gas payment is required');

        bytes memory payload = abi.encode(Command.DeployUpgradeable, msg.sender, userSalt, implementationBytecode, setupParams);

        _sendRemote(remoteChains, payload);
    }

    function upgradeRemoteContracts(
        RemoteChains[] calldata remoteChains,
        bytes32 userSalt,
        bytes calldata newImplementationBytecode,
        bytes calldata setupParams
    ) external payable {
        require(msg.value > 0, 'Gas payment is required');

        bytes memory payload = abi.encode(Command.UpgradeUpgradeable, msg.sender, userSalt, newImplementationBytecode, setupParams);

        _sendRemote(remoteChains, payload);
    }

    function _sendRemote(RemoteChains[] calldata remoteChains, bytes memory payload) internal {
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

    function _upgradeUpgradeable(
        address sender,
        bytes32 userSalt,
        bytes memory newImplementationBytecode,
        bytes memory setupParams,
        string memory sourceChain
    ) internal {
        bytes32 deploySalt = keccak256(abi.encode(sender, userSalt));
        address proxy = _create3Address(deploySalt);
        address newImplementation = _deployImplementation(deploySalt, newImplementationBytecode);
        bytes32 newImplementationCodeHash = newImplementation.codehash;
        IUpgradable(proxy).upgrade(newImplementation, newImplementationCodeHash, setupParams);
        emit Upgraded(sender, userSalt, proxy, newImplementation, sourceChain);
    }

    function _deployUpgradeable(
        address sender,
        bytes32 userSalt,
        bytes memory implementationBytecode,
        bytes memory setupParams,
        string memory sourceChain
    ) internal {
        bytes32 deploySalt = keccak256(abi.encode(sender, userSalt));
        address deployedImplementationAddress = _deployImplementation(deploySalt, implementationBytecode);
        address deployedProxyAddress = _deployProxy(deploySalt, deployedImplementationAddress, setupParams);

        emit Deployed(sender, userSalt, deployedProxyAddress, deployedImplementationAddress, sourceChain);
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
        bytes32 deploySalt,
        address implementationAddress,
        bytes memory setupParams
    ) internal returns (address deployedProxyAddress) {
        return
            _create3(abi.encodePacked(type(Proxy).creationCode, abi.encode(implementationAddress, address(this), setupParams)), deploySalt);
    }

    function _execute(string calldata sourceChain, string calldata sourceAddress, bytes calldata payload) internal override {
        if (!whitelistedSourceAddresses[sourceChain][sourceAddress]) {
            revert NotWhitelistedSourceAddress();
        }
        Command command = abi.decode(payload, (Command));

        if (command == Command.DeployStatic) {
            (, address sender, bytes32 userSalt, bytes memory bytecode) = abi.decode(payload, (Command, address, bytes32, bytes));
            _deployImplementation(keccak256(abi.encode(sender, userSalt)), bytecode);
        } else if (command == Command.DeployUpgradeable) {
            (, address sender, bytes32 userSalt, bytes memory bytecode, bytes memory setupParams) = abi.decode(
                payload,
                (Command, address, bytes32, bytes, bytes)
            );
            _deployUpgradeable(sender, userSalt, bytecode, setupParams, sourceChain);
        } else if (command == Command.UpgradeUpgradeable) {
            (, address sender, bytes32 userSalt, bytes memory bytecode, bytes memory setupParams) = abi.decode(
                payload,
                (Command, address, bytes32, bytes, bytes)
            );
            _upgradeUpgradeable(sender, userSalt, bytecode, setupParams, sourceChain);
        } else {
            revert('invalid command');
        }
    }

    function setWhitelistedSourceAddress(string calldata sourceChain, string calldata sourceSender, bool whitelisted) external onlyOwner {
        whitelistedSourceAddresses[sourceChain][sourceSender] = whitelisted;
        emit WhitelistedSourceAddressSet(sourceChain, sourceSender, whitelisted);
    }
}
