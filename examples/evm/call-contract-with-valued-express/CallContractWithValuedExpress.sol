//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import { AxelarValuedExpressExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/express/AxelarValuedExpressExecutable.sol';
import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';
import { Upgradable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/upgradable/Upgradable.sol';
import { MockERC20 } from './mocks/MockERC20.sol';

contract CallContractWithValuedExpress is AxelarValuedExpressExecutable {
    IAxelarGasService public immutable gasService;

    constructor(address _gateway, address _gasReceiver) AxelarValuedExpressExecutable(_gateway) {
        gasService = IAxelarGasService(_gasReceiver);
    }

    function sendValuedMessage(
        string memory _destinationChain,
        string memory _destinationAddress,
        address _tokenAddr,
        uint256 _amount,
        address _receiver
    ) external payable {
        require(msg.value > 0, 'insufficient funds');

        bytes memory valuedMsg = _deriveMsgValueForNonGatewayTokenValueTransfer(_tokenAddr, _amount, _receiver);

        gasService.payNativeGasForContractCall{ value: msg.value }(
            address(this),
            _destinationChain,
            _destinationAddress,
            valuedMsg,
            msg.sender
        );
        gateway.callContract(_destinationChain, _destinationAddress, valuedMsg);
    }

    function _execute(string calldata, string calldata, bytes calldata _payload) internal override {
        (address tokenAddress, uint256 value, address reciever) = abi.decode(_payload, (address, uint256, address));
        MockERC20(tokenAddress).mint(reciever, value);
    }

    function contractCallWithTokenValue(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload,
        string calldata symbol,
        uint256 amount
    ) public view override returns (address tokenAddress, uint256 value) {}

    function contractCallValue(
        string calldata,
        string calldata,
        bytes calldata payload
    ) public view virtual override returns (address tokenAddress, uint256 value) {
        (tokenAddress, value) = abi.decode(payload, (address, uint256));
    }

    function _deriveMsgValueForNonGatewayTokenValueTransfer(
        address _tokenAddr,
        uint256 _amount,
        address _receiver
    ) internal pure returns (bytes memory valueToBeTransferred) {
        valueToBeTransferred = abi.encode(_tokenAddr, _amount, _receiver);
    }
}
