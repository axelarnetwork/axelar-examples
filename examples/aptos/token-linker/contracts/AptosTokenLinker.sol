// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';
import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import { StringToAddress, AddressToString } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/libs/AddressString.sol';
import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';

contract AptosTokenLinker is AxelarExecutable {
    using StringToAddress for string;
    using AddressToString for address;

    error TokenLinkerZeroAddress();
    error TransferFailed();
    error TransferFromFailed();
    error InvalidSourceAddress();
    error InvalidSourceChain();

    event Sending(bytes32 indexed destinationAddress, uint256 indexed amount);
    event Receiving(address indexed destinationAddress, uint256 indexed amount);

    IAxelarGasService public immutable gasService;
    address public immutable tokenAddress;
    bytes32 public immutable aptosAddressHash;
    bytes32 public immutable aptosChainNameHash = keccak256('aptos');
    uint256 public immutable ignoreDigits;
    string public aptosAddress;

    constructor(
        address gatewayAddress_,
        address gasServiceAddress_,
        address tokenAddress_,
        string memory aptosAddress_,
        uint256 ignoreDigits_
    ) AxelarExecutable(gatewayAddress_) {
        if(gatewayAddress_ == address(0) || gasServiceAddress_ == address(0) || tokenAddress_ == address(0)) revert TokenLinkerZeroAddress();
        gasService = IAxelarGasService(gasServiceAddress_);
        tokenAddress = tokenAddress_;
        bytes memory suffix = bytes('::token_linker');
        uint256 length = bytes(aptosAddress_).length;
        bytes memory addressWithSuffix = new bytes(length + suffix.length);
        for(uint256 i=0; i< length; i++) {
            addressWithSuffix[i] = bytes(aptosAddress_)[i];
        }
        for(uint256 i=0; i< suffix.length; i++) {
            addressWithSuffix[i + length] = suffix[i];
        }

        aptosAddress = string(addressWithSuffix);
        aptosAddressHash = keccak256(bytes(aptosAddress_));
        ignoreDigits = ignoreDigits_;
    }

    function sendToken(
        bytes32 to,
        uint256 amount
    ) external payable {
        // Since aptos cannot have numbers as big as the evm, we ignore a certain number of bytes,
        // so we round off the numbers sent. This is accounted for in the aptos token linker.
        amount = (amount >> (ignoreDigits * 8)) << (ignoreDigits * 8);
        _takeToken(msg.sender, amount);

        bytes memory payload = abi.encode(to, amount);
        if (msg.value > 0) {
            gasService.payNativeGasForContractCall{ value: msg.value }(address(this), 'aptos', aptosAddress, payload, msg.sender);
        }
        gateway.callContract('aptos', aptosAddress, payload);

        emit Sending(to, amount);
    }

    function _execute(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal override {
        if (keccak256(bytes(sourceAddress)) != aptosAddressHash) revert InvalidSourceAddress();
        if (keccak256(bytes(sourceChain)) != aptosChainNameHash) revert InvalidSourceChain();
        (address recipient, uint256 amount) = abi.decode(payload, (address, uint256));
        _giveToken(recipient, amount);
        emit Receiving(recipient, amount);
    }

    function _giveToken(address to, uint256 amount) internal {
        (bool success, bytes memory returnData) = tokenAddress.call(abi.encodeWithSelector(IERC20.transfer.selector, to, amount));
        bool transferred = success && (returnData.length == uint256(0) || abi.decode(returnData, (bool)));

        if (!transferred || tokenAddress.code.length == 0) revert TransferFailed();
    }

    function _takeToken(address from, uint256 amount) internal {
        (bool success, bytes memory returnData) = tokenAddress.call(
            abi.encodeWithSelector(IERC20.transferFrom.selector, from, address(this), amount)
        );
        bool transferred = success && (returnData.length == uint256(0) || abi.decode(returnData, (bool)));

        if (!transferred || tokenAddress.code.length == 0) revert TransferFromFailed();
    }
}

