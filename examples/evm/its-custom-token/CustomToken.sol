// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';
import { InterchainToken } from '@axelar-network/interchain-token-service/contracts/interchain-token/InterchainToken.sol';

contract CustomToken is InterchainToken {
    string public value;
    string public sourceChain;
    string public sourceAddress;

    constructor(string memory name_, string memory symbol_, uint8 decimals_){
        name = name_;
        symbol = symbol_;
        decimals = decimals_;
    }

    function addDistributor(address distributor) external {
        _addDistributor(distributor);
    }
}
