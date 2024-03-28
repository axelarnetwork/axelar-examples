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

    constructor(address _gateway, address _gasReceiver) AxelarExpressExecutable(gateway_) {
        gasService = IAxelarGasService(gasReceiver_);
    }

    function sendToMany(
        string memory _destinationChain,
        string memory _destinationAddress,
        address[] calldata _destinationAddresses,
        string memory _symbol,
        uint256 _amount
    ) external payable {




        bytes memory valuedMsg = _deriveMsgValueForNonGatewayTokenValueTransfer(symbol, amount)
        if (msg.value > 0) {
            gasService.payNativeGasForContractCall{ value: msg.value }(
                address(this),
                destinationChain,
                destinationAddress,
                payload,
                msg.sender
            );
        }
        gateway.callContract(destinationChain, destinationAddress, payload);
    }

    function _executeWithToken(
        string calldata,
        string calldata,
        bytes calldata _payload,
        string calldata _tokenSymbol,
        uint256 _amount
    ) internal override {
        address[] memory recipients = abi.decode(payload, (address[]));
        address tokenAddress = gateway.tokenAddresses(tokenSymbol);

        uint256 sentAmount = amount / recipients.length;
        for (uint256 i = 0; i < recipients.length; i++) {
            IERC20(tokenAddress).transfer(recipients[i], sentAmount);
        }
    }

    function _deriveMsgValueForNonGatewayTokenValueTransfer(string memory _symbol, uint256 _amount) internal returns (bytes valueToBeTransferred){
        address tokenAddress = gateway.tokenAddresses(_symbol);
        valueToBeTransferred = abi.encode(tokenAddress, _amount);
    }
}
