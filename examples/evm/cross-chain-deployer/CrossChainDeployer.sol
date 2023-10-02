// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';
import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';
import { IDeployer } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IDeployer.sol';

contract CrossChainDeployer is AxelarExecutable {
    string public value;
    string public sourceChain;
    string public sourceAddress;
    IAxelarGasService public immutable gasService;
    IDeployer public immutable create3Deployer;

    constructor(address gateway_, address gasReceiver_, address create3Deployer_) AxelarExecutable(gateway_) {
        gasService = IAxelarGasService(gasReceiver_);
        create3Deployer = IDeployer(create3Deployer_);
    }

    function deployContract(
        string calldata destinationChain,
        string calldata destinationAddress,
        bytes calldata contractBytecode,
        bytes32 salt
    ) external payable {
        require(msg.value > 0, 'Gas payment is required');

        bytes memory payload = abi.encode(contractBytecode, salt);

        gasService.payNativeGasForContractCall{ value: msg.value }(
            address(this),
            destinationChain,
            destinationAddress,
            payload,
            msg.sender
        );
        gateway.callContract(destinationChain, destinationAddress, payload);
    }

    function _execute(string calldata, string calldata, bytes calldata payload_) internal override {
        (bytes memory contractBytecode, bytes32 salt) = abi.decode(payload_, (bytes, bytes32));
        create3Deployer.deploy((contractBytecode), salt);
    }
}
