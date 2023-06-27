//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';
import '@openzeppelin/contracts/utils/Strings.sol';

contract LendingSatellite is AxelarExecutable {
    string public baseChain;
    string public baseContract;

    constructor(
        address gateway_,
        string memory baseChain_,
        string memory baseContract_
    ) AxelarExecutable(gateway_) {
        baseChain = baseChain_;
        baseContract = baseContract_;
    }

    function supplyAndBorrow(
        string calldata supplyTokenSymbol,
        uint256 supplyAmount,
        string calldata borrowTokenSymbol,
        uint256 borrowAmount
    ) external {
        address supplyTokenAddress = gateway.tokenAddresses(supplyTokenSymbol);
        IERC20(supplyTokenAddress).transferFrom(msg.sender, address(this), supplyAmount);
        IERC20(supplyTokenAddress).approve(address(gateway), supplyAmount);

        bytes memory params = abi.encode(borrowTokenSymbol, borrowAmount, Strings.toHexString(uint256(uint160(msg.sender)), 20));
        bytes memory payload = abi.encode('supplyAndBorrow', params);

        gateway.callContractWithToken(baseChain, baseContract, payload, supplyTokenSymbol, supplyAmount);
    }

    function repayAndRedeem(
        string calldata repayTokenSymbol,
        uint256 repayAmount,
        string calldata redeemTokenSymbol,
        uint256 redeemAmount
    ) external {
        address repayTokenAddress = gateway.tokenAddresses(repayTokenSymbol);
        IERC20(repayTokenAddress).transferFrom(msg.sender, address(this), repayAmount);
        IERC20(repayTokenAddress).approve(address(gateway), repayAmount);

        bytes memory params = abi.encode(redeemTokenSymbol, redeemAmount, Strings.toHexString(uint256(uint160(msg.sender)), 20));
        bytes memory payload = abi.encode('repayAndRedeem', params);

        gateway.callContractWithToken(baseChain, baseContract, payload, repayTokenSymbol, repayAmount);
    }
}
