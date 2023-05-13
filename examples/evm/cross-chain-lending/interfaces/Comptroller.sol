//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface Comptroller {
    function _setMintPaused(address cToken, bool state) external returns (bool);

    function getAccountLiquidity(address account)
        external
        view
        returns (
            uint256,
            uint256,
            uint256
        );

    function enterMarkets(address[] memory cTokens) external returns (uint256[] memory);

    function redeemAllowed(
        address cToken,
        address redeemer,
        uint256 redeemTokens
    ) external returns (uint256);

    function getHypotheticalAccountLiquidity(
        address account,
        address cTokenModify,
        uint256 redeemTokens,
        uint256 borrowAmount
    )
        external
        view
        returns (
            uint256,
            uint256,
            uint256
        );
}
