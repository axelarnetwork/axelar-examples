// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import {IAxelarExecutable} from "@axelar-network/axelar-cgp-solidity/src/interfaces/IAxelarExecutable.sol";
import {AxelarGasReceiver} from "@axelar-network/axelar-cgp-solidity/src/gas-receiver/AxelarGasReceiver.sol";

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC4626} from "./IERC4626.sol";

contract StrategyStub is IAxelarExecutable {
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
    string public sourceChain;
    string public sourceAddress;
    mapping(string => string) public siblings;

    uint256 _mockDebtOutstanding;

    constructor(
        address want,
        address gateway_,
        address gasReceiver_
    ) IAxelarExecutable(gateway_) {
        gasReceiver = AxelarGasReceiver(gasReceiver_);
        //vault = _vault;
        //want = IERC20(IERC4626(vault).asset());
        //want.approve(vault, type(uint256).max - 1);
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
        string memory signature = "prepareReturn(uint256 _debtOutstanding)";
        bytes4 _selector = bytes4(keccak256(bytes(signature)));

        // calldata to be used to destinationAddress.call(payload)
        bytes memory payload = abi.encodeWithSelector(_selector, debtOutstanding);
        _sendRemoteMessage('Fantom', siblings['Fantom'], payload);
    }

    // Mock function for vault
    function _getDebtOutstanding() internal returns (uint256){
        _mockDebtOutstanding++;
        return _mockDebtOutstanding;
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
    ) internal override {
        (string memory messageType, bool success, string memory _data) = abi
            .decode(payload_, (string, bool, string));
        sourceChain = sourceChain_;
        sourceAddress = sourceAddress_;
    }

    function _callContract(bytes memory _callData)
        internal
        returns (bool success, bytes memory returnData)
    {
        (success, returnData) = address(this).call(_callData);
        return (success, returnData);
    }
}
