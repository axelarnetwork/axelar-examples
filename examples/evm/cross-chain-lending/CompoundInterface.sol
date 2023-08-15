//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';
import './interfaces/CErc20Interface.sol';
import './interfaces/Comptroller.sol';

contract CompoundInterface is AxelarExecutable {
    bytes32 internal constant SELECTOR_SUPPLY_AND_BORROW = keccak256('supplyAndBorrow');
    bytes32 internal constant SELECTOR_REPAY_AND_REDEEM = keccak256('repayAndRedeem');

    Comptroller public immutable comptroller;

    mapping(string => mapping(string => uint256)) public cBalances;

    mapping(string => CErc20Interface) internal _cTokens;

    modifier onlySelf() {
        require(msg.sender == address(this), 'Function must be called by the same contract only');
        _;
    }

    constructor(
        address gateway_,
        Comptroller comptroller_,
        string[] memory supportedTokens,
        address[] memory cTokens
    ) AxelarExecutable(gateway_) {
        require(supportedTokens.length == cTokens.length, 'Lengths missmatch');

        comptroller = comptroller_;

        for (uint256 i; i < supportedTokens.length; i++) {
            _cTokens[supportedTokens[i]] = CErc20Interface(cTokens[i]);
        }

        comptroller.enterMarkets(cTokens);
    }

    function supplyAndBorrow(
        string calldata sourceChain,
        string calldata,
        string calldata supplyTokenSymbol,
        uint256 supplyAmount,
        bytes memory params
    ) external onlySelf {
        (string memory borrowTokenSymbol, uint256 borrowAmount, string memory userAddress) = abi.decode(params, (string, uint256, string));

        _mint(supplyTokenSymbol, supplyAmount, userAddress);
        _borrow(sourceChain, userAddress, borrowTokenSymbol, borrowAmount);
    }

    function repayAndRedeem(
        string calldata sourceChain,
        string calldata,
        string calldata repayTokenSymbol,
        uint256 repayAmount,
        bytes memory params
    ) external onlySelf {
        (string memory redeemTokenSymbol, uint256 redeemAmount, string memory userAddress) = abi.decode(params, (string, uint256, string));

        _repayBorrow(repayTokenSymbol, repayAmount);
        _redeem(sourceChain, userAddress, redeemTokenSymbol, redeemAmount);
    }

    function _mint(string calldata tokenSymbol, uint256 amount, string memory userAddress) internal {
        CErc20Interface cToken = _cTokens[tokenSymbol];
        IERC20 tokenAddress = IERC20(gateway.tokenAddresses(tokenSymbol));

        tokenAddress.approve(address(cToken), amount);
        uint256 balanceBefore = cToken.balanceOf(address(this));
        uint256 result = cToken.mint(amount);
        require(result == 0, 'Error minting cTokens');
        uint256 mintedTokens = cToken.balanceOf(address(this)) - balanceBefore;

        cBalances[userAddress][tokenSymbol] += mintedTokens;
    }

    function _borrow(string calldata sourceChain, string memory userAddress, string memory tokenSymbol, uint256 amount) internal {
        CErc20Interface cToken = _cTokens[tokenSymbol];
        IERC20 tokenAddress = IERC20(gateway.tokenAddresses(tokenSymbol));

        // in production must limit borrow amount corresponding to the proportion this user supplied as collateral
        cToken.borrow(amount);

        tokenAddress.approve(address(gateway), amount);
        gateway.sendToken(sourceChain, userAddress, tokenSymbol, amount);
    }

    function _repayBorrow(string calldata tokenSymbol, uint256 amount) internal {
        CErc20Interface cToken = _cTokens[tokenSymbol];
        IERC20 tokenAddress = IERC20(gateway.tokenAddresses(tokenSymbol));

        tokenAddress.approve(address(cToken), amount);
        cToken.repayBorrow(amount);
    }

    function _redeem(string calldata sourceChain, string memory userAddress, string memory tokenSymbol, uint256 amount) internal {
        CErc20Interface cToken = _cTokens[tokenSymbol];
        IERC20 tokenAddress = IERC20(gateway.tokenAddresses(tokenSymbol));

        require(cBalances[userAddress][tokenSymbol] >= amount, 'Not enough balance');
        cBalances[userAddress][tokenSymbol] -= amount;

        uint256 balanceBefore = tokenAddress.balanceOf(address(this));
        uint256 result = cToken.redeem(amount);
        require(result == 0, 'Error redeeming for underlying');
        uint256 redeemedAmount = tokenAddress.balanceOf(address(this)) - balanceBefore;

        tokenAddress.approve(address(gateway), redeemedAmount);
        gateway.sendToken(sourceChain, userAddress, tokenSymbol, redeemedAmount);
    }

    function _executeWithToken(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload,
        string calldata tokenSymbol,
        uint256 amount
    ) internal override {
        (bytes memory functionName, bytes memory params) = abi.decode(payload, (bytes, bytes));

        bytes4 commandSelector;

        if (keccak256(functionName) == SELECTOR_SUPPLY_AND_BORROW) {
            commandSelector = CompoundInterface.supplyAndBorrow.selector;
        } else if (keccak256(functionName) == SELECTOR_REPAY_AND_REDEEM) {
            commandSelector = CompoundInterface.repayAndRedeem.selector;
        } else {
            revert('Invalid function name');
        }

        // solhint-disable-next-line avoid-low-level-calls
        (bool success, bytes memory result) = address(this).call(
            abi.encodeWithSelector(commandSelector, sourceChain, sourceAddress, tokenSymbol, amount, params)
        );

        // shouln't revert in production or tokens could be stuck
        if (!success) {
            if (result.length == 0) {
                require(success, 'Failed with no reason');
            } else {
                // rethrow same error
                assembly {
                    let start := add(result, 0x20)
                    let end := add(result, mload(result))
                    revert(start, end)
                }
            }
        }
    }
}
