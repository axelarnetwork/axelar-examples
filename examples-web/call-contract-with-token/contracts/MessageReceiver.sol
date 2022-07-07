//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import { IAxelarExecutable } from '@axelar-network/axelar-cgp-solidity/contracts/interfaces/IAxelarExecutable.sol';
import { IERC20 } from '@axelar-network/axelar-cgp-solidity/contracts/interfaces/IERC20.sol';
import { IAxelarGasService } from '@axelar-network/axelar-cgp-solidity/contracts/interfaces/IAxelarGasService.sol';

contract MessageReceiver is IAxelarExecutable {
    IAxelarGasService gasReceiver;

    constructor(address _gateway, address _gasReceiver) IAxelarExecutable(_gateway) {
        gasReceiver = IAxelarGasService(_gasReceiver);
    }

    event Executed();

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

        emit Executed();
    }
}
