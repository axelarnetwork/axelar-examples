//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

interface Comptroller {
    function pauseGuardian() external returns (address);

    function _setPauseGuardian(address newPauseGuardian) external returns (uint256);
}