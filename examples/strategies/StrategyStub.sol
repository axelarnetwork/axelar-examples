// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC4626} from "./IERC4626.sol";
import {IRouter} from "./IRouter.sol";
import {StringToAddress} from "../temp/StringToAddress.sol";

contract StrategyStub {
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
    StrategyState public state;
    IRouter router;
    string private chainName;
    string private sibblingName;
    mapping(string => string) public siblings;
    uint256 public _mockDebtOutstanding;

    /** 
        -----------------------
        | modifier definitions|
        ----------------------- 
    */

    constructor(address want, address router_) {
        router = IRouter(router_);
        //vault = _vault;
        //want = IERC20(IERC4626(vault).asset());
        //want.approve(vault, type(uint256).max - 1);
        chainName = "Ethereum";
        sibblingName = "Fantom";

        state = StrategyState.UPDATED;
    }

    function resetState() external {
        state = StrategyState.UPDATED;
    }

    function addSibling(string calldata chain_, string calldata address_)
        external
    {
        siblings[chain_] = address_;
    }

    function harvest() public {
        uint256 debtOutstanding = _getDebtOutstanding();
        if (state != StrategyState.UPDATED) {
            //_prepareReturn(debtOutstanding);
        }
    }

    function _prepareReturn(uint256 debtOutstanding) external payable {
        string memory signature = "_prepareReturn(uint256)";
        bytes4 _selector = bytes4(keccak256(bytes(signature)));

        // calldata to be used to destinationAddress.call(payload)
        bytes memory payload = abi.encodeWithSelector(_selector, debtOutstanding);
        router.sendRemoteMessage{value: msg.value}(sibblingName, siblings[sibblingName], payload);
        state = StrategyState.PENDING_MSG;
    }

    function _report(
        uint256 _profit,
        uint256 _loss,
        uint256 _debtPayment
    ) internal {
        state = StrategyState.UPDATED;
    }

    // Mock function for vault
    function _getDebtOutstanding() internal returns (uint256) {
        _mockDebtOutstanding++;
        return _mockDebtOutstanding;
    }
}
