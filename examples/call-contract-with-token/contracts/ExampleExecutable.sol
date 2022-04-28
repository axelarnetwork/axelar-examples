//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {IERC20} from "@axelar-network/axelar-cgp-solidity/src/ERC20.sol";
import {IAxelarExecutable} from "@axelar-network/axelar-cgp-solidity/src/interfaces/IAxelarExecutable.sol";

contract ExampleExecutable is IAxelarExecutable {
    event Executed(bytes32 indexed traceId);

    constructor(address _gateway) IAxelarExecutable(_gateway) {}

    function _executeWithToken(
        string memory,
        string memory,
        bytes calldata payload,
        string memory tokenSymbol,
        uint256 amount
    ) internal override {
        (bytes32 traceId, address[] memory recipients) = abi.decode(
            payload,
            (bytes32, address[])
        );
        address tokenAddress = gateway.tokenAddresses(tokenSymbol);

        uint256 sentAmount = amount / recipients.length;
        for (uint256 i = 0; i < recipients.length; i++) {
            IERC20(tokenAddress).transfer(recipients[i], sentAmount);
        }

        emit Executed(traceId);
    }
}
