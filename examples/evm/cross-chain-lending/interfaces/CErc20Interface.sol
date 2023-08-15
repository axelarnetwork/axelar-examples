//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface CErc20Interface {
    /*** User Interface ***/

    function mint(uint256 mintAmount) external returns (uint256);

    function redeem(uint256 redeemTokens) external returns (uint256);

    function redeemUnderlying(uint256 redeemAmount) external returns (uint256);

    function borrow(uint256 borrowAmount) external returns (uint256);

    function repayBorrow(uint256 repayAmount) external returns (uint256);

    function repayBorrowBehalf(address borrower, uint256 repayAmount) external returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function accrueInterest() external returns (uint256);

    function borrowBalanceStored(address account) external view returns (uint256);
}
