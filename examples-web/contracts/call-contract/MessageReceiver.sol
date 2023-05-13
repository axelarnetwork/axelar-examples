//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {AxelarExecutable} from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import {IAxelarGasService} from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';

contract MessageReceiver is AxelarExecutable {
    string public message = "no data";
    string public sourceChain;

    constructor(address gateway_, address _gasReceiver)
        AxelarExecutable(gateway_)
    {}

    event Executed(address indexed _from, string _value);

    function _execute(
        string calldata sourceChain_,
        string calldata,
        bytes calldata payload
    ) internal override {
        message = abi.decode(payload, (string));
        sourceChain = sourceChain_;
        emit Executed(msg.sender, message);
    }
}
