// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';

import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';

import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';

contract InterchainDefi is AxelarExecutable {
    address public wmatic //Mumbai: 0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889
    address public weth //Mumbai: 0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa

    IAxelarGasService public immutable gasService;

    // mumbai router
    ISwapRouter public immutable swapRouter = ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);

    constructor(address _gateway, address _gasService, address _wmatic, address _weth) AxelarExecutable(_gateway) {
        gasService = IAxelarGasService(_gasService);
        wmatic = _wmatic;
        weth = _weth;
    }
    
    // Example from live demo was: //WMATIC from Celo sent to Mumbai for the swap
    function interchainSwap(
        string memory _destChain,
        string memory _destContractAddr,
        string memory _symbol, 
        uint256 _amount
    ) external payable {
        require(msg.value > 0, 'Gas payment required');

        uint24 poolFee = 3000;

        address tokenAddress = gateway.tokenAddresses(_symbol);

        IERC20(tokenAddress).transferFrom(msg.sender, address(this), _amount);
        IERC20(tokenAddress).approve(address(gateway), _amount);

        ISwapRouter.ExactInputSingleParams memory swapParams = ISwapRouter.ExactInputSingleParams({
            tokenIn: wmatic,
            tokenOut: weth,
            fee: poolFee,
            recipient: msg.sender,
            deadline: block.timestamp + 1 days,
            amountIn: _amount,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });

        bytes memory encodedSwapPayload = abi.encode(swapParams);

        gasService.payNativeGasForContractCallWithToken{ value: msg.value }(
            address(this),
            _destChain,
            _destContractAddr,
            encodedSwapPayload,
            _symbol,
            _amount,
            msg.sender
        );

        gateway.callContractWithToken(_destChain, _destContractAddr, encodedSwapPayload, _symbol, _amount);
    }

    function _executeWithToken(
        string calldata,
        string calldata,
        bytes calldata _payload,
        string calldata,
        uint256 _amount
    ) internal override {
        ISwapRouter.ExactInputSingleParams memory decodedGmpMessage = abi.decode(_payload, (ISwapRouter.ExactInputSingleParams));

        IERC20(wmatic).approve(address(swapRouter), _amount);

        swapRouter.exactInputSingle(decodedGmpMessage);
    }
}
