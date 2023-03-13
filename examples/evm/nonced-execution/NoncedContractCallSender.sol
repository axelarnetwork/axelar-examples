// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';

contract NoncedContractCallSender {
    error AlreadyInitialized();

    IAxelarGateway public gateway;
    mapping(string => mapping(address => uint256)) public outgoingNonces;
    string public executableContract;
    IAxelarGasService public gasReceiver;

    function init(
        address gateway_,
        address gasReceiver_,
        string memory executableContract_
    ) external {
        if (address(gateway) != address(0) || address(gasReceiver) != address(0) || bytes(executableContract).length != 0)
            revert AlreadyInitialized();

        gateway = IAxelarGateway(gateway_);
        gasReceiver = IAxelarGasService(gasReceiver_);
        executableContract = executableContract_;
    }

    function sendContractCall(string calldata destinationChain, bytes calldata payload) external payable {
        bytes memory newPayload = abi.encode(outgoingNonces[destinationChain][msg.sender]++, msg.sender, payload);
        string memory executableContract_ = executableContract;
        if (msg.value > 0) {
            gasReceiver.payNativeGasForContractCall{ value: msg.value }(
                address(this),
                destinationChain,
                executableContract_,
                newPayload,
                msg.sender
            );
        }
        gateway.callContract(destinationChain, executableContract_, newPayload);
    }

    function sendContractCallWithToken(
        string calldata destinationChain,
        bytes calldata payload,
        string calldata symbol,
        uint256 amount
    ) external payable {
        bytes memory newPayload = abi.encode(outgoingNonces[destinationChain][msg.sender]++, msg.sender, payload);
        string memory executableContract_ = executableContract;
        if (msg.value > 0) {
            gasReceiver.payNativeGasForContractCallWithToken(
                address(this),
                destinationChain,
                executableContract_,
                payload,
                symbol,
                amount,
                msg.sender
            );
        }
        gateway.callContractWithToken(destinationChain, executableContract_, newPayload, symbol, amount);
    }
}
