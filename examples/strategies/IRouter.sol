// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import {IAxelarExecutable} from "@axelar-network/axelar-cgp-solidity/src/interfaces/IAxelarExecutable.sol";
import {AxelarGasReceiver} from "@axelar-network/axelar-cgp-solidity/src/gas-receiver/AxelarGasReceiver.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";


interface IRouter { 
    function sendRemoteMessage(string memory destinationChain, string memory destinationAddress, bytes memory payload) external payable;
}