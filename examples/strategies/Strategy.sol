// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import {IAxelarExecutable} from "@axelar-network/axelar-cgp-solidity/src/interfaces/IAxelarExecutable.sol";
import {AxelarGasReceiver} from "@axelar-network/axelar-cgp-solidity/src/gas-receiver/AxelarGasReceiver.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IRouter} from "./IRouter.sol";
import { StringToAddress } from '../temp/StringToAddress.sol';

contract Strategy {
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
    IRouter router;
    StrategyState public state;
    string private sibblingName;
    string private chainName;
    mapping(string => string) public siblings;

    event WrongSourceAddress(string sourceAddress);

    constructor(
        address want_,
        address router_
    ) {
    
        sibblingName = "Ethereum";
        router = IRouter(router_);
        state = StrategyState.UPDATED;
        executed = false;
    }


    function addSibling(string calldata chain_, string calldata address_)
        external
    {   
        siblings[chain_] = address_;
    }


    function resetState()
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
    function _prepareReturn(uint256 _debtOutstanding) external
    {   

        state = StrategyState.MGMT_REQIRED;
        (uint256 _profit, uint256 _loss, uint256 _debtPayment) = prepareReturn(_debtOutstanding);
        executed = true;
        // string memory signature = "_report(uint256 _profit, uint256 _loss, uint256 _debtPayment)";
        // bytes4 _selector = bytes4(keccak256(bytes(signature)));
        // bytes memory payload = abi.encodeWithSelector(_selector, _profit, _loss, _debtPayment);
        //_sendRemoteMessage(sibblingName, siblings[sibblingName], payload);
    }
}
