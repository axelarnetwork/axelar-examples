// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';

import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';

contract MultichainGameReceiver is AxelarExecutable {
    string[] public uniqueTokens;

    IAxelarGasService public immutable gasService;

    constructor(address _gateway, address _gasService) AxelarExecutable(_gateway) {
        gasService = IAxelarGasService(_gasService);
    }

    function _executeWithToken(
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

        uint256 diceResult = (block.timestamp % 6) + 1;
        // uint256 diceResult = 5; for testing

        _addUniqueTokenSymbol(_tokenSymbol);

        bool won = guess == diceResult;

        if (won) _payOutAllTokensToWinner(player, _sourceAddress, _sourceChain);
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

    function _payOutAllTokensToWinner(address _player, string calldata _sourceAddress, string calldata _winnersChain) internal {
        for (uint i = 0; i < uniqueTokens.length; i++) {
            string memory tokenSymbol = uniqueTokens[i];

            address tokenAddress = gateway.tokenAddresses(tokenSymbol);

            uint256 transferAmount = IERC20(tokenAddress).balanceOf(address(this));

            IERC20(tokenAddress).approve(address(gateway), transferAmount);

            gateway.callContractWithToken(_winnersChain, _sourceAddress, abi.encode(_player), tokenSymbol, transferAmount);
        }
    }
}
