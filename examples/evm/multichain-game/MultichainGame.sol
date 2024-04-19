// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';

import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';
import '@openzeppelin/contracts/utils/Strings.sol';
import { AddressToString, StringToAddress } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/libs/AddressString.sol';

import { MultichainGameReceiver } from './MultichainGameReceiver.sol';

contract MultichainGame is AxelarExecutable {
    using AddressToString for address;
    using StringToAddress for string;

    IAxelarGasService public immutable gasService;

    constructor(address _gateway, address _gasService) AxelarExecutable(_gateway) {
        gasService = IAxelarGasService(_gasService);
    }

    function guessNumber(
        string memory _destChain, //"" if not cross chain bet
        string calldata _gameReceiver,
        uint256 _guess,
        string memory _symbol,
        uint256 _amount
    ) external payable {
        require(_guess >= 1 && _guess <= 6, 'Invalid guess');

        address tokenAddress = gateway.tokenAddresses(_symbol);

        require(tokenAddress != address(0), 'Invalid token');

        if (bytes(_destChain).length == 0) {
            //NO MULTICHAIN TX PLAYING ON SAME CHAIN
            IERC20(tokenAddress).transferFrom(msg.sender, _gameReceiver.toAddress(), _amount);
            _checkIfWinner(msg.sender, _guess, _gameReceiver.toAddress());
        } else {
            //MULTICHAIN TX FROM CHAIN A TO CHAIN B
            require(msg.value > 0, 'Insufficient gas');

            bytes memory encodedGuess = abi.encode(msg.sender, _guess);

            IERC20(tokenAddress).transferFrom(msg.sender, address(this), _amount);
            IERC20(tokenAddress).approve(address(gateway), _amount);

            gasService.payNativeGasForContractCallWithToken{ value: msg.value }(
                address(this),
                _destChain,
                _gameReceiver,
                encodedGuess,
                _symbol,
                _amount,
                msg.sender
            );

            gateway.callContractWithToken(_destChain, _gameReceiver, encodedGuess, _symbol, _amount);
        }
    }

    function _executeWithToken(
        string calldata,
        string calldata,
        bytes calldata _payload,
        string calldata _symbol,
        uint256 _amount
    ) internal override {
        address player = abi.decode(_payload, (address));
        address tokenAddress = gateway.tokenAddresses(_symbol);
        IERC20(tokenAddress).transfer(player, _amount);
    }

    function _checkIfWinner(address _player, uint256 _guess, address _gameReceiver) internal {
        uint256 diceResult = 5; //for testing
        // uint256 diceResult = (block.timestamp % 6) + 1;

        bool won = _guess == diceResult;

        if (won) _payoutWinner(_player, _gameReceiver);
    }

    function _payoutWinner(address _player, address _gameReceiver) internal {
        MultichainGameReceiver(_gameReceiver).payOutAllTokensToWinnerSameChain(_player, address(this).toString(), Strings.toString(block.chainid));
    }
}
