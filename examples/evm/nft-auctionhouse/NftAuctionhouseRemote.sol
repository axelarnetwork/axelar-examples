// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';
import './NftAuctionhouse.sol';
import { AddressToString } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/libs/AddressString.sol';

contract NftAuctionhouseRemote is NftAuctionhouse, AxelarExecutable {
    IAxelarGasService public immutable gasService;
    mapping(address => mapping(uint256 => address)) biddersRemote;
    mapping(address => mapping(uint256 => string)) sourceChains;
    mapping(address => mapping(uint256 => address)) refundAddresses;

    using AddressToString for address;

    constructor(
        address gateway_,
        address gasReceiver_,
        address usdc_
    ) NftAuctionhouse(usdc_) AxelarExecutable(gateway_) {
        gasService = IAxelarGasService(gasReceiver_);
    }

    function bidRemote(
        string calldata destinationChain,
        string calldata destinationAuctionhouse,
        address operator,
        uint256 tokenId,
        address bidder,
        uint256 amount
    ) external payable {
        require(msg.value > 0, 'Gas payment is required');


        usdc.transferFrom(msg.sender, address(this), amount);
        usdc.approve(address(gateway), amount);
        bytes memory payload = abi.encode(msg.sender, bidder, operator, tokenId);
            gasService.payNativeGasForContractCallWithToken{ value: msg.value }(
                address(this),
                destinationChain,
                destinationAuctionhouse,
                payload,
                'aUSDC',
                amount,
                msg.sender
            );
        gateway.callContractWithToken(destinationChain, destinationAuctionhouse, payload, 'aUSDC', amount);
    }

    function _executeWithToken(
        string calldata sourceChain,
        string calldata, /*sourceAddress*/
        bytes calldata payload,
        string calldata tokenSymbol,
        uint256 amount
    ) internal override {
        (address refundAddress, address bidder, address operator, uint256 tokenId) = abi.decode(
            payload,
            (address, address, address, uint256)
        );
        (bool success, ) = address(this).call(abi.encodeWithSelector(this._bid.selector, address(this), operator, tokenId, amount));
        if (!success) {
            usdc.approve(address(gateway), amount);
            gateway.sendToken(sourceChain, refundAddress.toString(), tokenSymbol, amount);
        } else {
            biddersRemote[operator][tokenId] = bidder;
            sourceChains[operator][tokenId] = sourceChain;
            refundAddresses[operator][tokenId] = refundAddress;
        }
    }

    function _refundPrevBidder(
        address bidder,
        uint256 amount,
        address operator,
        uint256 tokenId
    ) internal override {
        if (bidder == address(this)) {
            usdc.approve(address(gateway), amount);
            gateway.sendToken(sourceChains[operator][tokenId], refundAddresses[operator][tokenId].toString(), 'aUSDC', amount);
        } else {
            usdc.transfer(bidder, amount);
        }
    }

    function _giveNft(
        address auctioneer,
        address lastBidder,
        address operator,
        uint256 tokenId,
        uint256 lastBid
    ) internal override {
        usdc.transfer(auctioneer, lastBid);
        address actualBidder = lastBidder == address(this) ? biddersRemote[operator][tokenId] : lastBidder;

        IERC721(operator).transferFrom(address(this), actualBidder, tokenId);

        bidders[operator][tokenId] = address(0);
        bids[operator][tokenId] = 0;
    }
}
