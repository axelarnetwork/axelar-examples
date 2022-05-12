// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import {IAxelarExecutable} from "@axelar-network/axelar-cgp-solidity/src/interfaces/IAxelarExecutable.sol";
import {AxelarGasReceiver} from "@axelar-network/axelar-cgp-solidity/src/gas-receiver/AxelarGasReceiver.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { StringToAddress } from '../temp/StringToAddress.sol';

contract Strategy is IAxelarExecutable {
    using StringToAddress for string;
    address public vault;
    IERC20 public want;

    enum StrategyState {
        UPDATED,
        PENDING_MSG,
        PENDING_TRANSFER,
        MGMT_REQIRED
    }

    bool public executed; 
    StrategyState public state;
    string private sibblingName;
    string private chainName;

    AxelarGasReceiver public gasReceiver;
    mapping(string => string) public siblings;
    event WrongSourceAddress(string sourceAddress);

    /**
        -----------------------
        | modifier definitions|
        ----------------------- 
    */

    /**
    * @notice
    * check if the sending chains `sourceChainName_` is the `sibblingName`
    */
    modifier isValidSourceAddress(string memory sourceChainName_, string memory sourceAddress_){
        require(sourceAddress_.toAddress() == siblings[sourceChainName_].toAddress(), "Source Address is not allowed");
        _;
    }


    /**
    * @notice
    * check if the sending chains `sourceChainName_` is the `sibblingName`
    */
    modifier isValidSourceChain(string memory sourceChainName_){
        require(keccak256(abi.encodePacked((sourceChainName_))) == keccak256(abi.encodePacked(sibblingName)), "");
        _;
    }


    constructor(
        address want_,
        address gateway_,
        address gasReceiver_
    ) IAxelarExecutable(gateway_) {
        gasReceiver = AxelarGasReceiver(gasReceiver_);
        chainName = "Fantom";
        sibblingName = "Ethereum";
        state = StrategyState.UPDATED;
        executed = false;
    }


    function addSibling(string calldata chain_, string calldata address_)
        external
    {   
        siblings[chain_] = address_;
    }



    function flipState()
        external
    {
        state = StrategyState.UPDATED;
        executed = false;
    }


    /**
     * @notice
     * Called from `_prepareReturn` which was triggere cross chain
    */
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


    /**
     * @notice
     * Called via low level call API when receiving cross chain message.
     * Responsible to call function on cross chain side to report nav
    */
    function _prepareReturn(uint256 _debtOutstanding) public
    {   

        state = StrategyState.MGMT_REQIRED;
        (uint256 _profit, uint256 _loss, uint256 _debtPayment) = prepareReturn(_debtOutstanding);
        // string memory signature = "_report(uint256 _profit, uint256 _loss, uint256 _debtPayment)";
        // bytes4 _selector = bytes4(keccak256(bytes(signature)));
        // bytes memory payload = abi.encodeWithSelector(_selector, _profit, _loss, _debtPayment);
        //_sendRemoteMessage(sibblingName, siblings[sibblingName], payload);
    }


    function _sendRemoteMessage(
        string memory destinationChain,
        string memory destinationAddress,
        bytes memory payload
    ) internal {
        if (msg.value > 0) {
            gasReceiver.payNativeGasForContractCall{value: msg.value}(
                address(this),
                destinationChain,
                destinationAddress,
                payload,
                msg.sender
            );
        }
        gateway.callContract(destinationChain, destinationAddress, payload);
    }


    /*Handles calls created by setAndSend. Updates this contract's value 
    and gives the token received to the destination specified at the source chain. */
    function _execute(
        string memory sourceChain_,
        string memory sourceAddress_,
        bytes calldata payload_
        ) 
        internal 
        isValidSourceChain(sourceChain_)
        isValidSourceAddress(sourceChain_, sourceAddress_)
        override 
    {   
        _callContract(payload_);
    }


    function _callContract(bytes memory _callData)
        internal
        returns (bool success, bytes memory returnData)
    {
        (success, returnData) = address(this).call(_callData);
        require(success);
        executed = true;
        return (success, returnData);
    }
}
