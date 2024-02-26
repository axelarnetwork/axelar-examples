//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';

/**
 * @title Call Contract With Token Contract
 * @notice Send a token along with an Axelar GMP message between two blockchains
 */
contract CallContractWithToken is AxelarExecutable {
    IAxelarGasService public immutable gasService;

    event Executed();

    /**
     * 
     * @param _gateway address of axl gateway on deployed chain
     * @param _gasReceiver address of axl gas service on deployed chain
     */
    constructor(address _gateway, address _gasReceiver) AxelarExecutable(_gateway) {
        gasService = IAxelarGasService(_gasReceiver);
    }

    /**
     * @notice trigger interchain tx from src chain
     * @dev destinationAddresses will be passed in as gmp message in this tx
     * @param destinationChain name of the dest chain (ex. "Fantom")
     * @param destinationAddress address on dest chain this tx is going to
     * @param destinationAddresses recipient addresses receiving sent funds 
     * @param symbol symbol of token being sent
     * @param amount amount of tokens being sent
     */
    function sendToMany(
        string memory destinationChain,
        string memory destinationAddress,
        address[] calldata destinationAddresses,
        string memory symbol,
        uint256 amount
    ) external payable {
        require(msg.value > 0, 'Gas payment is required');

        address tokenAddress = gateway.tokenAddresses(symbol);
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount);
        IERC20(tokenAddress).approve(address(gateway), amount);
        bytes memory payload = abi.encode(destinationAddresses);
        gasService.payNativeGasForContractCallWithToken{ value: msg.value }(
            address(this),
            destinationChain,
            destinationAddress,
            payload,
            symbol,
            amount,
            msg.sender
        );
        gateway.callContractWithToken(destinationChain, destinationAddress, payload, symbol, amount);
    }



    /**
     * @notice logic to be executed on dest chain
     * @dev this is triggered automatically by relayer
     * @param
     * @param
     * @param payload encoded gmp message sent from src chain
     * @param tokenSymbol symbol of token sent from src chain
     * @param amount amount of tokens sent from src chain
     */
    function _executeWithToken(
        string calldata,
        string calldata,
        bytes calldata payload,
        string calldata tokenSymbol,
        uint256 amount
    ) internal override {
        address[] memory recipients = abi.decode(payload, (address[]));
        address tokenAddress = gateway.tokenAddresses(tokenSymbol);

        uint256 sentAmount = amount / recipients.length;
        for (uint256 i = 0; i < recipients.length; i++) {
            IERC20(tokenAddress).transfer(recipients[i], sentAmount);
        }

        emit Executed();
    }
}
