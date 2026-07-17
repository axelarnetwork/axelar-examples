//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { AxelarExpressExecutableWithToken } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/express/AxelarExpressExecutableWithToken.sol';
import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';

// ============================================================================================
// RED FLAG — DEMO ONLY. DO NOT USE THIS PATTERN AS-IS IN PRODUCTION.
//
// Extending an EXPRESS executable exposes the PUBLIC, PERMISSIONLESS entry points
// expressExecute() and expressExecuteWithToken(). These call _execute()/_executeWithToken()
// WITHOUT any gateway verification and with the source parameters (sourceChain, sourceAddress,
// payload) supplied directly by the caller.
//
// Consequence: authenticating the message by comparing sourceChain/sourceAddress inside the
// handler does NOT protect an express executable — an attacker just passes the expected values
// to the express entry point. expressExecute() is free; expressExecuteWithToken() only requires
// fronting `amount` tokens (which a forwarding handler sends right back).
//
// Only make a handler an express executable if running it early with arbitrary, unverified,
// attacker-chosen source data is harmless — i.e. the worst case is that the express caller loses
// the funds it fronted (e.g. the handler does nothing but forward exactly those fronted tokens per
// the payload). If the handler cannot be made safe under fully-unverified, permissionless
// invocation, it MUST NOT be an express executable. There is no "trusted relayer" fix: relayers are
// untrusted transport, and allowlisting an express operator just reintroduces a trusted third party
// that can still trigger the handler with forged source data.
// ============================================================================================
contract CallContractWithTokenExpress is AxelarExpressExecutableWithToken {
    IAxelarGasService public immutable gasService;

    event Executed(bytes32 commandId, string sourceChain, string sourceAddress, bytes payload);
    event ExecutedWithToken(bytes32 commandId, string sourceChain, string sourceAddress, bytes payload, string tokenSymbol, uint256 amount);

    constructor(address gateway_, address gasReceiver_) AxelarExpressExecutableWithToken(gateway_) {
        gasService = IAxelarGasService(gasReceiver_);
    }

    function sendToMany(
        string memory destinationChain,
        string memory destinationAddress,
        address[] calldata destinationAddresses,
        string memory symbol,
        uint256 amount
    ) external payable {
        address tokenAddress = gatewayWithToken().tokenAddresses(symbol);
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount);
        IERC20(tokenAddress).approve(address(gatewayWithToken()), amount);
        bytes memory payload = abi.encode(destinationAddresses);
        if (msg.value > 0) {
            gasService.payNativeGasForContractCallWithToken{ value: msg.value }(
                address(this),
                destinationChain,
                destinationAddress,
                payload,
                symbol,
                amount,
                msg.sender
            );
        }
        gatewayWithToken().callContractWithToken(destinationChain, destinationAddress, payload, symbol, amount);
    }

    function _execute(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal override {
        emit Executed(commandId,sourceChain, sourceAddress, payload);
    }

    function _executeWithToken(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload,
        string calldata tokenSymbol,
        uint256 amount
    ) internal override {
        // Source-parameter checks do NOT secure this handler — see the express RED FLAG banner
        // above. This is safe only because it forwards exactly the tokens fronted for it and does
        // nothing privileged or stateful.
        address[] memory recipients = abi.decode(payload, (address[]));
        require(recipients.length > 0, 'No recipients');
        address tokenAddress = gatewayWithToken().tokenAddresses(tokenSymbol);

        uint256 sentAmount = amount / recipients.length;
        for (uint256 i = 0; i < recipients.length; i++) {
            IERC20(tokenAddress).transfer(recipients[i], sentAmount);
        }

        emit ExecutedWithToken(commandId, sourceChain, sourceAddress, payload, tokenSymbol, amount);
    }
}
