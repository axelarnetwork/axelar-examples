// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import {IAxelarExecutable} from "@axelar-network/axelar-cgp-solidity/src/interfaces/IAxelarExecutable.sol";
import {AxelarGasReceiver} from "@axelar-network/axelar-cgp-solidity/src/gas-receiver/AxelarGasReceiver.sol";

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC4626} from "./IERC4626.sol";
import { StringToAddress } from '../temp/StringToAddress.sol';

contract StrategyStub is IAxelarExecutable {

    using StringToAddress for string;
    // vault address reference
    address public vault;
    // token managed and accounted by the vault
    IERC20 public want;
    enum StrategyState {
        UPDATED,
        PENDING_MSG,
        PENDING_TRANSFER,
        MGMT_REQIRED
    }
    StrategyState state;
    AxelarGasReceiver gasReceiver;
    mapping(string => string) public siblings;
    string private chainName;
    string private sibblingName;

    uint256 public _mockDebtOutstanding;
    
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
        address want,
        address gateway_,
        address gasReceiver_
    ) IAxelarExecutable(gateway_) {
        gasReceiver = AxelarGasReceiver(gasReceiver_);
        //vault = _vault;
        //want = IERC20(IERC4626(vault).asset());
        //want.approve(vault, type(uint256).max - 1);
        chainName = "Ethereum";
        sibblingName = "Fantom";

        state = StrategyState.UPDATED;
    }

    function addSibling(string calldata chain_, string calldata address_)
        external
    {
        siblings[chain_] = address_;
    }


    function harvest() public {
        uint256 debtOutstanding = _getDebtOutstanding();
        if (state != StrategyState.UPDATED){
            _prepareReturn(debtOutstanding);
        }

    }


    function _prepareReturn(uint256 debtOutstanding) internal {
        string memory signature = "_prepareReturn(uint256 _debtOutstanding)";
        bytes4 _selector = bytes4(keccak256(bytes(signature)));

        // calldata to be used to destinationAddress.call(payload)
        bytes memory payload = abi.encodeWithSelector(_selector, debtOutstanding);
        _sendRemoteMessage(sibblingName, siblings[sibblingName], payload);
    }


    function _report(uint256 _profit, uint256 _loss, uint256 _debtPayment) internal {
    }

    // Mock function for vault
    function _getDebtOutstanding() internal returns (uint256){
        _mockDebtOutstanding++;
        return _mockDebtOutstanding;
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
        return (success, returnData);
    }
}
