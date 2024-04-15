// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';

import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';

contract MultichainGame is AxelarExecutable {
    IAxelarGasService public immutable gasService;

    address public gameReceiver;

    string[] public uniqueTokens;

    constructor(address _gateway, address _gasService, address _gameReceiver) AxelarExecutable(_gateway) {
        gasService = IAxelarGasService(_gasService);
        gameReceiver = _gameReceiver;
    }

    function guessNumber(
        string memory _destChain,
        string calldata _destContractAddr,
        uint256 _guess,
        string memory _symbol,
        uint256 _amount
    ) external payable {
        require(_guess >= 1 && _guess <= 6, 'Invalid guess');

        address tokenAddress = gateway.tokenAddresses(_symbol);

        require(tokenAddress != address(0), 'Invalid token');

        if (bytes(_destChain).length == 0 && bytes(_destContractAddr).length == 0) {
            //NO MULTICHAIN TX PLAYING ON SAME CHAIN
            IERC20(tokenAddress).transferFrom(msg.sender, gameReceiver, _amount);
            _checkIfWinner(msg.sender, _guess, _symbol, _amount);
        } else {
            //MULTICHAIN TX FROM CHAIN A TO CHAIN B
            require(msg.value > 0, 'Insufficient gas');

            bytes memory encodedGuess = abi.encode(msg.sender, _guess);

            IERC20(tokenAddress).transferFrom(msg.sender, address(this), _amount);
            IERC20(tokenAddress).approve(address(gateway), _amount);

            gasService.payNativeGasForContractCallWithToken{ value: msg.value }(
                address(this),
                _destChain,
                _destContractAddr,
                encodedGuess,
                _symbol,
                _amount,
                msg.sender
            );

            gateway.callContractWithToken(_destChain, _destContractAddr, encodedGuess, _symbol, _amount);
        }
    }

    function _executeWithToken(
        string calldata _sourceChain,
        string calldata,
        bytes calldata _payload,
        string calldata _symbol,
        uint256 _amount
    ) internal override {
        address player = abi.decode(_payload, (address));
        address tokenAddress = gateway.tokenAddresses(_symbol);
        IERC20(tokenAddress).transfer(player, _amount);
    }

    function _checkIfWinner(address _player, uint256 _guess, string memory _tokenSymbol, uint256 _amount) internal {
        _addUniqueTokenSymbol(_tokenSymbol);
        uint256 diceResult = (block.timestamp % 6) + 1;
        // uint256 diceResult = 5; for testing

        bool won = _guess == diceResult;

        if (won) _payOutAllTokensToWinner(_player);
    }

    function _payOutAllTokensToWinner(address _player) internal {
        for (uint i = 0; i < uniqueTokens.length; i++) {
            string memory tokenSymbol = uniqueTokens[i];
            address tokenAddress = gateway.tokenAddresses(tokenSymbol);
            uint256 transferAmount = IERC20(tokenAddress).balanceOf(address(this));
            IERC20(tokenAddress).transfer(_player, transferAmount);
        }
    }

    function _addUniqueTokenSymbol(string memory _tokenSymbol) internal {
        bool found = false;

        for (uint256 i = 0; i < uniqueTokens.length; i++) {
            if (keccak256(abi.encode(uniqueTokens[i])) == keccak256(abi.encode(_tokenSymbol))) {
                found = true;
                break;
            }
        }
        if (!found) uniqueTokens.push(_tokenSymbol);
    }
}
