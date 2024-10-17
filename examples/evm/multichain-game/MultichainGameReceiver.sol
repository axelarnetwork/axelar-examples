// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';

import { AxelarExecutableWithToken } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutableWithToken.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';
import '@openzeppelin/contracts/utils/Strings.sol';

contract MultichainGameReceiver is AxelarExecutableWithToken {
    string[] public uniqueTokens;

    IAxelarGasService public immutable gasService;

    address multichainGame;

    constructor(address _gateway, address _gasService, address _game) AxelarExecutableWithToken(_gateway) {
        gasService = IAxelarGasService(_gasService);
        multichainGame = _game;
    }

    function payOutAllTokensToWinnerSameChain(address _player, string calldata _sourceAddress, string calldata _winnersChain) external {
        require(msg.sender == multichainGame, 'invalid sender');
        _payout(_player, _sourceAddress, _winnersChain);
    }

    function _executeWithToken(
        bytes32 /*commandId*/,
        string calldata _sourceChain,
        string calldata _sourceAddress,
        bytes calldata _payload,
        string calldata _symbol,
        uint256
    ) internal override {
        _checkIfWinner(_payload, _symbol, _sourceAddress, _sourceChain);
    }

    function _checkIfWinner(
        bytes calldata _payload,
        string memory _tokenSymbol,
        string calldata _sourceAddress,
        string calldata _sourceChain
    ) internal {
        (address player, uint256 guess) = abi.decode(_payload, (address, uint256));

        uint256 diceResult = 5; // for testing
        // uint256 diceResult = (block.timestamp % 6) + 1;

        _addUniqueTokenSymbol(_tokenSymbol);

        bool won = guess == diceResult;

        if (won) _payOutAllTokensToWinnerInternal(player, _sourceAddress, _sourceChain);
    }

    function _addUniqueTokenSymbol(string memory _tokenSymbol) internal {
        bool found = false;

        for (uint i = 0; i < uniqueTokens.length; i++) {
            if (keccak256(abi.encode(uniqueTokens[i])) == keccak256(abi.encode(_tokenSymbol))) {
                found = true;
                break;
            }
        }
        if (!found) uniqueTokens.push(_tokenSymbol);
    }

    function _payOutAllTokensToWinnerInternal(address _player, string calldata _sourceAddress, string calldata _winnersChain) internal {
        _payout(_player, _sourceAddress, _winnersChain);
    }

    function _payout(address _player, string calldata _sourceAddress, string calldata _winnersChain) internal {
        for (uint i = 0; i < uniqueTokens.length; i++) {
            string memory tokenSymbol = uniqueTokens[i];
            address tokenAddress = gatewayWithToken().tokenAddresses(tokenSymbol);
            uint256 transferAmount = IERC20(tokenAddress).balanceOf(address(this));
            if (keccak256(abi.encode(_winnersChain)) == keccak256(abi.encode(Strings.toString(block.chainid)))) {
                IERC20(tokenAddress).transfer(_player, transferAmount);
            } else {
                IERC20(tokenAddress).approve(address(gatewayWithToken()), transferAmount);
                gatewayWithToken().callContractWithToken(_winnersChain, _sourceAddress, abi.encode(_player), tokenSymbol, transferAmount);
            }
        }
    }

    function _execute(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal virtual override {}
}
