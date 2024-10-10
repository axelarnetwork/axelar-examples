//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutableWithToken.sol';
import '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';
import '@openzeppelin/contracts/utils/Strings.sol';

contract LendingSatellite is AxelarExecutableWithToken {
    string public baseChain;
    string public baseContract;

    constructor(address gateway_, string memory baseChain_, string memory baseContract_) AxelarExecutableWithToken(gateway_) {
        baseChain = baseChain_;
        baseContract = baseContract_;
    }

    function supplyAndBorrow(
        string calldata supplyTokenSymbol,
        uint256 supplyAmount,
        string calldata borrowTokenSymbol,
        uint256 borrowAmount
    ) external {
        address supplyTokenAddress = gatewayWithToken().tokenAddresses(supplyTokenSymbol);
        IERC20(supplyTokenAddress).transferFrom(msg.sender, address(this), supplyAmount);
        IERC20(supplyTokenAddress).approve(address(gatewayWithToken()), supplyAmount);

        bytes memory params = abi.encode(borrowTokenSymbol, borrowAmount, Strings.toHexString(uint256(uint160(msg.sender)), 20));
        bytes memory payload = abi.encode('supplyAndBorrow', params);

        gatewayWithToken().callContractWithToken(baseChain, baseContract, payload, supplyTokenSymbol, supplyAmount);
    }

    function repayAndRedeem(
        string calldata repayTokenSymbol,
        uint256 repayAmount,
        string calldata redeemTokenSymbol,
        uint256 redeemAmount
    ) external {
        address repayTokenAddress = gatewayWithToken().tokenAddresses(repayTokenSymbol);
        IERC20(repayTokenAddress).transferFrom(msg.sender, address(this), repayAmount);
        IERC20(repayTokenAddress).approve(address(gatewayWithToken()), repayAmount);

        bytes memory params = abi.encode(redeemTokenSymbol, redeemAmount, Strings.toHexString(uint256(uint160(msg.sender)), 20));
        bytes memory payload = abi.encode('repayAndRedeem', params);

        gatewayWithToken().callContractWithToken(baseChain, baseContract, payload, repayTokenSymbol, repayAmount);
    }

    function _execute(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal virtual override {}

    function _executeWithToken(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload,
        string calldata tokenSymbol,
        uint256 amount
    ) internal virtual override {}
}
