// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

contract NftAuctionhouse {
    IERC20 public immutable usdc;
    mapping(address => mapping(uint256 => uint256)) public bids;
    mapping(address => mapping(uint256 => uint256)) public deadlines;
    mapping(address => mapping(uint256 => address)) public bidders;
    mapping(address => mapping(uint256 => address)) public auctioneers;
    mapping(address => mapping(uint256 => uint256)) public minAmounts;
    uint256 public constant NUMERATOR = 4;
    uint256 public constant DEMONINATOR = 3;
    uint256 public constant NO_MIN = type(uint256).max;

    modifier onlySelf() {
        require(msg.sender == address(this), 'NOT_SELF');
        _;
    }

    constructor(address usdc_) {
        usdc = IERC20(usdc_);
    }

    function isAuctionRunning(address operator, uint256 tokenId) public view returns (bool) {
        return deadlines[operator][tokenId] > block.timestamp;
    }

    function auction(
        address operator,
        uint256 tokenId,
        uint256 minAmount,
        uint256 deadline
    ) external {
        IERC721(operator).transferFrom(msg.sender, address(this), tokenId);
        require(deadline > block.timestamp, 'AUCTION_EXPIRED');
        deadlines[operator][tokenId] = deadline;
        minAmounts[operator][tokenId] = minAmount == 0 ? NO_MIN : minAmount;
        auctioneers[operator][tokenId] = msg.sender;
    }

    function bid(
        address operator,
        uint256 tokenId,
        uint256 amount
    ) external {
        usdc.transferFrom(msg.sender, address(this), amount);
        this._bid(msg.sender, operator, tokenId, amount);
    }

    function _bid(
        address bidder,
        address operator,
        uint256 tokenId,
        uint256 amount
    ) public onlySelf {
        uint256 minAmount = minAmounts[operator][tokenId];
        require(minAmount != 0, 'NOT_AUCTIONING');
        require(block.timestamp <= deadlines[operator][tokenId], 'AUCTION_EXPIRED');
        address prevBidder = bidders[operator][tokenId];
        uint256 prevBid = bids[operator][tokenId];
        require(prevBid * NUMERATOR <= amount * DEMONINATOR && (minAmount == NO_MIN || amount >= minAmount) && amount > 0, 'BID_TOO_LOW');
        if (prevBidder != address(0)) {
            _refundPrevBidder(prevBidder, prevBid, operator, tokenId);
        }
        bidders[operator][tokenId] = bidder;
        bids[operator][tokenId] = amount;
    }

    function _refundPrevBidder(
        address bidder,
        uint256 amount,
        address, /*operator*/
        uint256 /*tokenId*/
    ) internal virtual {
        usdc.transfer(bidder, amount);
    }

    function resolveAuction(address operator, uint256 tokenId) external {
        address auctioneer = auctioneers[operator][tokenId];
        require(auctioneer != address(0), 'NOT_AUCTIONING');
        require(block.timestamp > deadlines[operator][tokenId], 'AUCTION_RUNNING');

        address lastBidder = bidders[operator][tokenId];
        uint256 lastBid = bids[operator][tokenId];
        if (lastBidder != address(0)) {
            _giveNft(auctioneer, lastBidder, operator, tokenId, lastBid);
        } else {
            IERC721(operator).transferFrom(address(this), auctioneer, tokenId);
        }
        deadlines[operator][tokenId] = 0;
        minAmounts[operator][tokenId] = 0;
        auctioneers[operator][tokenId] = address(0);
    }

    function _giveNft(
        address auctioneer,
        address lastBidder,
        address operator,
        uint256 tokenId,
        uint256 lastBid
    ) internal virtual {
        usdc.transfer(auctioneer, lastBid);
        IERC721(operator).transferFrom(address(this), lastBidder, tokenId);
        bidders[operator][tokenId] = address(0);
        bids[operator][tokenId] = 0;
    }
}
