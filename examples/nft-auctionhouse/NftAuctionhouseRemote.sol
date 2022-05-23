// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@axelar-network/axelar-cgp-solidity/src/interfaces/IAxelarExecutable.sol';
import '@axelar-network/axelar-cgp-solidity/src/interfaces/IAxelarGasReceiver.sol';
import './NftAuctionhouse.sol';
import { AddressFormat } from '@axelar-network/axelar-cgp-solidity/src/util/AddressFormat.sol';


contract NftAuctionhouseRemote is NftAuctionhouse, IAxelarExecutable {
    IAxelarGasReceiver gasReceiver;
    mapping(address => mapping(uint256 => address)) biddersRemote;
    mapping(address => mapping(uint256 => string)) sourceChains;
    mapping(address => mapping(uint256 => address)) refundAddresses;

    using AddressFormat for address;

    constructor(address gateway_, address gasReceiver_, address usdc_) 
    IAxelarExecutable(gateway_) NftAuctionhouse(usdc_) {
        gasReceiver = IAxelarGasReceiver(gasReceiver_);
    }

    function bidRemote(
        string calldata destinationChain, 
        string calldata destinationAuctionhouse, 
        address operator, 
        uint256 tokenId,
        address bidder,
        uint256 amount
    ) external payable {revert('here');
        usdc.transferFrom(msg.sender, address(this), amount);
        usdc.approve(address(gateway), amount);
        bytes memory payload = abi.encode(msg.sender, bidder, operator, tokenId);
        if(msg.value > 0) {
            gasReceiver.payNativeGasForContractCallWithToken{value: msg.value}(
                address(this),
                destinationChain,
                destinationAuctionhouse,
                payload,
                'aUSDC',
                amount,
                msg.sender
            );
        }
        gateway.callContractWithToken(
            destinationChain,
            destinationAuctionhouse,
            payload,
            'aUSDC',
            amount
        );
    }

    function _executeWithToken(
        string memory sourceChain,
        string memory /*sourceAddress*/,
        bytes calldata payload,
        string memory tokenSymbol,
        uint256 amount
    ) internal override {
        (
            address refundAddress, 
            address bidder, 
            address operator, 
            uint256 tokenId
        ) = abi.decode(payload, (address, address, address, uint256));
        (bool success, ) = address(this).call(abi.encodeWithSelector(this._bid.selector, operator, tokenId, amount));
        if(!success) {
            gateway.sendToken(sourceChain, refundAddress.toLowerString(), tokenSymbol, amount);
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
        if(bidder == address(this)) {
            gateway.sendToken(
                sourceChains[operator][tokenId], 
                refundAddresses[operator][tokenId].toLowerString(),
                'aUSDC',
                amount
            );
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