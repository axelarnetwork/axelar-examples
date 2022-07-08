// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import { ERC20 } from '@axelar-network/axelar-cgp-solidity/contracts/ERC20.sol';
import { IAxelarGateway } from '@axelar-network/axelar-cgp-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IAxelarExecutable } from '@axelar-network/axelar-cgp-solidity/contracts/interfaces/IAxelarExecutable.sol';
import { IAxelarGasService } from '@axelar-network/axelar-cgp-solidity/contracts/interfaces/IAxelarGasService.sol';
import { StringToAddress, AddressToString } from 'axelar-utils-solidity/contracts/StringAddressUtils.sol';
import { IERC20CrossChain } from './IERC20CrossChain.sol';

contract ERC20CrossChain is IAxelarExecutable, IERC20CrossChain, ERC20 {
    using StringToAddress for string;
    using AddressToString for address;

    error AlreadyInitialized();

    event FalseSender(string sourceChain, string sourceAddress);

    IAxelarGasService public gasReceiver;

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) IAxelarExecutable(address(0)) ERC20(name_, symbol, decimals_) {}

    function init(address gateway_, address gasReceiver_) external {
        if (address(gateway) != address(0) || address(gasReceiver) != address(0)) revert AlreadyInitialized();
        gasReceiver = IAxelarGasService(gasReceiver_);
        gateway = IAxelarGateway(gateway_);
    }

    // This is for testing.
    function giveMe(uint256 amount) external {
        _mint(msg.sender, amount);
    }

    function transferRemote(
        string calldata destinationChain,
        address destinationAddress,
        uint256 amount
    ) public payable override {
        _burn(msg.sender, amount);
        bytes memory payload = abi.encode(destinationAddress, amount);
        string memory stringAddress = address(this).toString();
        if (msg.value > 0) {
            gasReceiver.payNativeGasForContractCall{ value: msg.value }(
                address(this),
                destinationChain,
                stringAddress,
                payload,
                msg.sender
            );
        }
        gateway.callContract(destinationChain, stringAddress, payload);
    }

    function _execute(
        string memory, /*sourceChain*/
        string memory sourceAddress,
        bytes calldata payload
    ) internal override {
        if (sourceAddress.toAddress() != address(this)) {
            emit FalseSender(sourceAddress, sourceAddress);
            return;
        }
        (address to, uint256 amount) = abi.decode(payload, (address, uint256));
        _mint(to, amount);
    }
}
