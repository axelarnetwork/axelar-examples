// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import {IAxelarExecutable} from "@axelar-network/axelar-cgp-solidity/src/interfaces/IAxelarExecutable.sol";
import {AxelarGasReceiver} from "@axelar-network/axelar-cgp-solidity/src/gas-receiver/AxelarGasReceiver.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IRouter} from "./IRouter.sol";
import {StringToAddress} from "../temp/StringToAddress.sol";

contract Router is IAxelarExecutable, IRouter {
    using StringToAddress for string;
    AxelarGasReceiver gasReceiver;
    bool public executed;
    mapping(string => string) public siblings;
    mapping(string => address) public strategies;

    string private sibblingName;
    string private chainName;

    /**
        -----------------------
        | modifier definitions|
        ----------------------- 
    */

    /**
     * @notice
     * check if the sending chains `sourceChainName_` is the `sibblingName`
     */
    modifier isValidSourceAddress(
        string memory sourceChainName_,
        string memory sourceAddress_
    ) {
        require(
            sourceAddress_.toAddress() ==
                siblings[sourceChainName_].toAddress(),
            "Source Address is not allowed"
        );
        _;
    }

    /**
     * @notice
     * check if the sending chains `sourceChainName_` is the `sibblingName`
     */
    modifier isValidSourceChain(string memory sourceChainName_) {
        require(
            keccak256(abi.encodePacked((sourceChainName_))) ==
                keccak256(abi.encodePacked(sibblingName)),
            ""
        );
        _;
    }


    constructor(address gateway_, address gasReceiver_)
        IAxelarExecutable(gateway_)
    {
        gasReceiver = AxelarGasReceiver(gasReceiver_);
    }


    function addSibling(string calldata chain_, string calldata address_)
        external
    {   
        siblings[chain_] = address_;
    }


    function addStrategy(string calldata destinationAddress_, address strategy_)
        external
    {   
        strategies[destinationAddress_] = strategy_;
    }

    /**
     * @notice
     * send `payload` to `destinationChain` to be used via low level
     * call api `destinationAddress.call(payload)`
     * @dev
     * @param destinationChain axelar defined chain name
     * @param destinationAddress destination chain address
     * @param payload calldata
     */
    function sendRemoteMessage(
        string memory destinationChain,
        string memory destinationAddress,
        bytes memory payload
    ) external payable {
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

    /**
     * Handles calls created by setAndSend. Updates this contract's value
     * and gives the token received to the destination specified at the source chain.
     **/
    function _execute(
        string memory sourceChain_,
        string memory sourceAddress_,
        bytes calldata payload_
    )
        internal
        override
        //isValidSourceChain(sourceChain_)
        //isValidSourceAddress(sourceChain_, sourceAddress_)
    {   
        address target = strategies[sourceAddress_];
        require(target != address(0), "Strategy not registred");
        (bool success, bytes memory returnData) = _callContract(target, payload_);
        executed = success;

    }

    function _callContract(address target, bytes memory _callData)
        internal
        returns (bool success, bytes memory returnData)
    {
        (success, returnData) = target.call(_callData);
    }
}
