//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { AxelarExecutableWithToken } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutableWithToken.sol';
import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';
import { SafeTokenTransfer, SafeTokenTransferFrom } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/libs/SafeTransfer.sol';

/**
 * @title Call Contract With Token
 * @notice Send a token along with an Axelar GMP message between two blockchains
 */
contract CallContractWithToken is AxelarExecutableWithToken {
    using SafeTokenTransfer for IERC20;
    using SafeTokenTransferFrom for IERC20;

    IAxelarGasService public immutable gasService;

    event Executed(bytes32 commandId, string sourceChain, string sourceAddress, bytes payload);
    event ExecutedWithToken(bytes32 commandId, string sourceChain, string sourceAddress, bytes payload, string tokenSymbol, uint256 amount);

    /**
     *
     * @param _gateway address of axl gateway on deployed chain
     * @param _gasReceiver address of axl gas service on deployed chain
     */
    constructor(address _gateway, address _gasReceiver) AxelarExecutableWithToken(_gateway) {
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

        address tokenAddress = gatewayWithToken().tokenAddresses(symbol);
        IERC20(tokenAddress).safeTransferFrom(msg.sender, address(this), amount);
        IERC20(tokenAddress).approve(address(gatewayWithToken()), amount);
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
        gatewayWithToken().callContractWithToken(destinationChain, destinationAddress, payload, symbol, amount);
    }

    function _execute(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal override {
        emit Executed(commandId, sourceChain, sourceAddress, payload);
    }

    /**
     * @notice logic to be executed on dest chain
     * @dev this is triggered automatically by relayer
     * @param payload encoded gmp message sent from src chain
     * @param tokenSymbol symbol of token sent from src chain
     * @param amount amount of tokens sent from src chain
     */
    function _executeWithToken(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload,
        string calldata tokenSymbol,
        uint256 amount
    ) internal override {
        // This handler is intentionally permissionless, and that is safe here: it only distributes
        // the tokens delivered with THIS message (`amount`) among the payload-supplied recipients and
        // holds no funds or privileged state, so a forged call can only move the caller's own
        // delivered tokens (sentAmount * len <= amount). Authenticating the source would buy nothing.
        // Add source authentication when a forged message could command value or state it is not
        // entitled to — see cross-chain-lending in this repo, which must verify the sender.
        address[] memory recipients = abi.decode(payload, (address[]));
        require(recipients.length > 0, 'No recipients');
        address tokenAddress = gatewayWithToken().tokenAddresses(tokenSymbol);

        uint256 sentAmount = amount / recipients.length;
        for (uint256 i = 0; i < recipients.length; i++) {
            IERC20(tokenAddress).safeTransfer(recipients[i], sentAmount);
        }

        emit ExecutedWithToken(commandId, sourceChain, sourceAddress, payload, tokenSymbol, amount);
    }
}
