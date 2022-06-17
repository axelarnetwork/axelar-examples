//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {IAxelarForecallable} from "@axelar-network/axelar-cgp-solidity/contracts/interfaces/IAxelarForecallable.sol";
import {IERC20} from "@axelar-network/axelar-cgp-solidity/contracts/interfaces/IERC20.sol";
import { IAxelarGasService } from '@axelar-network/axelar-cgp-solidity/contracts/interfaces/IAxelarGasService.sol';

contract DistributionExecutable is IAxelarForecallable {
   IAxelarGasService gasReceiver;

    constructor(address _gateway, address _gasReceiver) IAxelarForecallable(_gateway) {
        gasReceiver = IAxelarGasService(_gasReceiver);
    }

    function sendToMany(
        string memory destinationChain,
        string memory destinationAddress,
        address[] calldata destinationAddresses,
        string memory symbol,
        uint256 amount
    ) external payable {
        address tokenAddress = gateway.tokenAddresses(symbol);
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount);
        IERC20(tokenAddress).approve(address(gateway), amount);
        bytes memory payload = abi.encode(destinationAddresses);
        if(msg.value > 0) {
            gasReceiver.payNativeGasForContractCallWithToken{value: msg.value}(
                address(this),
                destinationChain,
                destinationAddress,
                payload,
                symbol,
                amount,
                msg.sender
            );
        }
        gateway.callContractWithToken(destinationChain, destinationAddress, payload, symbol, amount);
    }
    function _executeWithToken(
        string memory,
        string memory,
        bytes calldata payload,
        string memory tokenSymbol,
        uint256 amount
    ) internal override {
        address[] memory recipients = abi.decode(payload, (address[]));
        address tokenAddress = gateway.tokenAddresses(tokenSymbol);

        uint256 sentAmount = amount / recipients.length;
        for (uint256 i = 0; i < recipients.length; i++) {
            IERC20(tokenAddress).transfer(recipients[i], sentAmount);
        }
    }

    function amountPostFee(uint256 amount) public override returns (uint256) {

    }
}
