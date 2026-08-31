//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { AxelarExpressExecutableWithToken } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/express/AxelarExpressExecutableWithToken.sol';
import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';

/**
 * Important
 *
 * `expressExecute` / `expressExecuteWithToken` can be called by anyone willing to pay for the
 * transfer upfront, so the `commandId`, `sourceChain`, `sourceAddress` and `payload` reaching
 * `_execute` / `_executeWithToken` are NOT validated by the Axelar gateway on that path.
 *
 * Only the token transfer itself should be treated as having value. Do not authorize anything on
 * `sourceChain` / `sourceAddress` here, and do not spend funds the call did not bring in. Both
 * handlers below hold to that: `_executeWithToken` distributes exactly the `amount` the express
 * executor transferred, and `_execute` only emits.
 *
 * To opt out of express entirely, override `expressExecute` / `expressExecuteWithToken` to revert,
 * or inherit `AxelarExecutableWithToken` instead.
 */
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
        address[] memory recipients = abi.decode(payload, (address[]));
        address tokenAddress = gatewayWithToken().tokenAddresses(tokenSymbol);

        // Only the amount should be treated as having value
        uint256 sentAmount = amount / recipients.length;
        for (uint256 i = 0; i < recipients.length; i++) {
            IERC20(tokenAddress).transfer(recipients[i], sentAmount);
        }

        emit ExecutedWithToken(commandId, sourceChain, sourceAddress, payload, tokenSymbol, amount);
    }

    function contractId() external pure returns (bytes32) {
        return keccak256('distribution-proxy');
    }
}
