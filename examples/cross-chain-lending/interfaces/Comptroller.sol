//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

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
}
