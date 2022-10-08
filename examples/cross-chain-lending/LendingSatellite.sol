//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import '@axelar-network/axelar-cgp-solidity/contracts/interfaces/IAxelarGateway.sol';

contract LendingSatellite {
    IAxelarGateway public gateway;

    constructor(IAxelarGateway gateway_) {
        gateway = gateway_;
    }

    function supplyAndBorrow(
        string calldata supplyTokenSymbol,
        string calldata borrowTokenSymbol,
        uint256 supplyAmount,
        uint256 borrowAmount
    ) external {}
}
