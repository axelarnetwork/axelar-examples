//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import { AxelarExpressExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/express/AxelarExpressExecutable.sol';
import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';
import { Upgradable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/upgradable/Upgradable.sol';

contract CallContractWithValuedExpress is AxelarExpressExecutable {
    IAxelarGasService public immutable gasService;

    constructor(address _gateway, address _gasReceiver) AxelarExpressExecutable(_gateway) {
        gasService = IAxelarGasService(_gasReceiver);
    }

    function sendValuedMessage(
        string memory _destinationChain,
        string memory _destinationAddress,
        string memory _symbol,
        uint256 _amount,
        address _receiver
    ) external payable {
        bytes memory valuedMsg = _deriveMsgValueForNonGatewayTokenValueTransfer(_symbol, _amount, _receiver);
        if (msg.value > 0) {
            gasService.payNativeGasForContractCall{ value: msg.value }(
                address(this),
                _destinationChain,
                _destinationAddress,
                valuedMsg,
                msg.sender
            );
        }
        gateway.callContract(_destinationChain, _destinationAddress, valuedMsg);
    }

    function _execute(string calldata, string calldata, bytes calldata _payload) internal override {
        // abi.decode()
    }

    function contractCallValue(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) public view virtual returns (address tokenAddress, uint256 value) {}

    function _deriveMsgValueForNonGatewayTokenValueTransfer(
        string memory _symbol,
        uint256 _amount,
        address _receiver
    ) internal returns (bytes memory valueToBeTransferred) {
        address tokenAddress = gateway.tokenAddresses(_symbol);
        valueToBeTransferred = abi.encode(tokenAddress, _amount, _receiver);
    }
}
