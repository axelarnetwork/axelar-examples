// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import { IAxelarExecutable } from '@axelar-network/axelar-cgp-solidity/src/interfaces/IAxelarExecutable.sol';
import { AxelarGasReceiver } from '@axelar-network/axelar-cgp-solidity/src/gas-receiver/AxelarGasReceiver.sol';
import { IERC20 } from '@axelar-network/axelar-cgp-solidity/src/interfaces/IERC20.sol';

/// @dev An abstract contract responsible for sending token to and receiving token from another TokenLinker.
abstract contract TokenLinker is IAxelarExecutable {
    event SendInitiated(string destinationChain, address indexed recipient, uint256 amount);

    event ReceiveCompleted(string sourceChain, address indexed recipient, uint256 amount);

    address public immutable token;
    mapping(string => string) public links;
    AxelarGasReceiver gasReceiver;

    constructor(address gateway_, address gasReceiver_, address token_) IAxelarExecutable(gateway_) {
        token = token_;
        gasReceiver = AxelarGasReceiver(gasReceiver_);
    }

    //Call this function on setup to tell this contract who it's sibling contracts are.
    function addLinker(string calldata chain_, string calldata address_) external {
        links[chain_] = address_;
    }

    function sendTo(
        string memory chain_,
        address recipient_,
        uint256 amount_,
        address gasToken, 
        uint256 gasAmount
    ) external {
        require(bytes(links[chain_]).length != 0, 'IVALID_DESTINATION_CHAIN');
        _collectToken(msg.sender, amount_);
        IERC20(gasToken).transferFrom(msg.sender, address(this), gasAmount);
        IERC20(gasToken).approve(address(gasReceiver), gasAmount);
        bytes memory payload = abi.encode(recipient_, amount_);
        gasReceiver.payGasForContractCall(
            chain_,
            links[chain_],
            payload,
            gasToken,
            gasAmount
        );
        gateway.callContract(
            chain_,
            links[chain_],
            payload
        );
        emit SendInitiated(chain_, recipient_, amount_);
    }

   function _execute(
        string memory sourceChain_,
        string memory sourceAddress_, 
        bytes calldata payload_
    ) internal override {
        require(keccak256(bytes(links[sourceChain_])) == keccak256(bytes(sourceAddress_)), 'IVALID_SOURCE');
        address recipient;
        uint256 amount;
        (recipient, amount) = abi.decode(payload_, (address, uint256));
        _giveToken(recipient, amount);
        emit ReceiveCompleted(sourceChain_, recipient, amount);
    }

    function _collectToken(address from, uint256 amount) internal virtual;
    function _giveToken(address to, uint256 amount) internal virtual;
}