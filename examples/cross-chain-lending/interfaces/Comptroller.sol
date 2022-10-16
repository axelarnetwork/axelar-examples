//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

interface Comptroller {
    function _setMintPaused(address cToken, bool state) external returns (bool);
}
