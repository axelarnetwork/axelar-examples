// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import { SendAckReceiver } from './SendAckReceiver.sol';
import { IAxelarExecutable } from '@axelar-network/axelar-cgp-solidity/contracts/interfaces/IAxelarExecutable.sol';

contract SendAckReceiverImplementation is SendAckReceiver {
    
    constructor(address gateway_) IAxelarExecutable(gateway_) {}
    string[] public messages;

    function messagesLength() external view returns (uint256) {
        return messages.length;
    }

    // override this to do stuff
    function _executePostAck(
        string memory /*sourceChain*/,
        string memory /*sourceAddress*/,
        bytes memory payload
    ) internal override {
        string memory message = abi.decode(payload, (string));
        messages.push(message);
    }   
}