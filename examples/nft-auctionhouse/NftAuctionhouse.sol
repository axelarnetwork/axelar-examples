// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

contract NftAuctionhouse {
    IERC20 public immutable usdc;
    mapping(address => mapping(uint256 => uint256)) public bids;
    mapping(address => mapping(uint256 => uint256)) public deadlines;
    mapping(address => mapping(uint256 => address)) public bidders;
    mapping(address => mapping(uint256 => address)) public auctioneers;
    mapping(address => mapping(uint256 => uint256)) public minAmounts;
    uint256 constant public NUMERATOR = 4;
    uint256 constant public DEMONINATOR = 3;
    uint256 constant public NO_MIN = type(uint256).max;

    constructor(address usdc_) {
        usdc = IERC20(usdc_);
    }

    function auction(address operator, uint256 tokenId, uint256 minAmount, uint256 deadline) external {
        IERC721(operator).transferFrom(msg.sender, address(this), tokenId);
        require(deadline > block.timestamp, 'AUCTION_EXPIRED'); 
        deadlines[operator][tokenId] = deadline;
        minAmounts[operator][tokenId] = minAmount == 0 ? NO_MIN : minAmount;
        auctioneers[operator][tokenId] = msg.sender;
    }

    function bid(address operator, uint256 tokenId, uint256 amount) external {
        uint256 minAmount = minAmounts[operator][tokenId];
        require(minAmount != 0, 'NOT_AUCTIONING');
        require(block.timestamp <= deadlines[operator][tokenId], 'AUCTION_EXPIRED');
        usdc.transferFrom(msg.sender, address(this), amount);
        address prevBidder = bidders[operator][tokenId];
        uint256 prevBid = bids[operator][tokenId];
        require(prevBid * NUMERATOR <= amount * DEMONINATOR && (minAmount == NO_MIN || amount >= minAmount) && amount > 0, 'BID_TOO_LOW');
        if(prevBidder != address(0)) {
            usdc.transfer(prevBidder, prevBid);
        }
        bidders[operator][tokenId] = msg.sender;
        bids[operator][tokenId] = amount;
    }

    function resolveAuction(address operator, uint256 tokenId) external {
        address auctioneer = auctioneers[operator][tokenId];
        require(auctioneer != address(0), 'NOT_AUCTIONING');
        require(block.timestamp > deadlines[operator][tokenId], 'AUCTION_RUNNING');
        
        address lastBidder = bidders[operator][tokenId];
        uint256 lastBid = bids[operator][tokenId];
        if(lastBidder != address(0)) {
            usdc.transfer(auctioneer, lastBid);
            IERC721(operator).transferFrom(address(this), lastBidder, tokenId);
            bidders[operator][tokenId] = address(0);
            bids[operator][tokenId] = 0;
        }
        deadlines[operator][tokenId] = 0;
        minAmounts[operator][tokenId] = 0;
        auctioneers[operator][tokenId] = address(0);
    }
}