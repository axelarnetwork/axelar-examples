// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import {IAxelarExecutable} from "@axelar-network/axelar-cgp-solidity/src/interfaces/IAxelarExecutable.sol";
import {AxelarGasReceiver} from "@axelar-network/axelar-cgp-solidity/src/gas-receiver/AxelarGasReceiver.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Strategy is IAxelarExecutable {
    address public vault;
    IERC20 public want;

    AxelarGasReceiver gasReceiver;
    mapping(string => string) public siblings;

    constructor(
        address want_,
        address gateway_,
        address gasReceiver_
    ) IAxelarExecutable(gateway_) {
        
        gasReceiver = AxelarGasReceiver(gasReceiver_);
    }

    function prepareReturn(uint256 _debtOutstanding)
        internal
        returns (
            uint256 _profit,
            uint256 _loss,
            uint256 _debtPayment
        )
    {
        return (100, 0 , 0);
    }
}
