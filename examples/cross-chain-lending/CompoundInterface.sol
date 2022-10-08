//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import '@axelar-network/axelar-gmp-sdk-solidity/contracts/executables/AxelarForecallable.sol';
import './Compound/CErc20Interface.sol';

contract CompoundInterface is AxelarForecallable {
    bytes32 internal constant SELECTOR_SUPPLY_AND_BORROW = keccak256('supplyAndBorrow');
    bytes32 internal constant SELECTOR_REPAY_BORROW = keccak256('repayBorrow');

    mapping(address => CErc20Interface) internal _cTokens;

    constructor(address gateway_) AxelarForecallable(gateway_) {}

    function supplyAndBorrow(
        CErc20Interface cToken,
        uint256 supplyAmount,
        bytes memory params
    ) external {
        uint256 borrowAmount = abi.decode(params, (uint256));

        _mint(cToken, supplyAmount);
        _borrow(cToken, borrowAmount);
    }

    function repayBorrow(
        CErc20Interface cToken,
        uint256 amount,
        bytes memory
    ) external {
        cToken.repayBorrow(amount);
    }

    function _mint(CErc20Interface cToken, uint256 amount) internal {
        cToken.mint(amount);
    }

    function _borrow(CErc20Interface cToken, uint256 amount) internal {
        cToken.borrow(amount);
    }

    function _executeWithToken(
        string calldata,
        string calldata,
        bytes calldata payload,
        string calldata tokenSymbol,
        uint256 amount
    ) internal override {
        (bytes memory functionName, bytes memory params) = abi.decode(payload, (bytes, bytes));
        address tokenAddress = gateway.tokenAddresses(tokenSymbol);

        CErc20Interface cToken = _cTokens[tokenAddress];

        bytes4 commandSelector;
        bytes32 functionHash = keccak256(functionName);

        if (functionHash == SELECTOR_SUPPLY_AND_BORROW) {
            commandSelector = CompoundInterface.supplyAndBorrow.selector;
        } else if (functionHash == SELECTOR_REPAY_BORROW) {
            commandSelector = CompoundInterface.repayBorrow.selector;
        } else {
            revert('Invalid function name');
        }

        // solhint-disable-next-line avoid-low-level-calls
        (bool success, ) = address(this).call(abi.encodeWithSelector(commandSelector, cToken, amount, params));

        // TODO: error handling
    }
}
