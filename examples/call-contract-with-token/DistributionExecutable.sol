//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {IAxelarExecutable} from "@axelar-network/axelar-cgp-solidity/src/interfaces/IAxelarExecutable.sol";
import {IERC20} from "@axelar-network/axelar-cgp-solidity/src/interfaces/IERC20.sol";

contract DistributionExecutable is IAxelarExecutable {
    constructor(address gatewayAddress) IAxelarExecutable(gatewayAddress) {}

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
}
