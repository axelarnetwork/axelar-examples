// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import { AxelarExecutableWithToken } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutableWithToken.sol';
import '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';
import './NftAuctionhouse.sol';

contract NftAuctionhouseRemote is NftAuctionhouse, AxelarExecutableWithToken {
    // sendToken has been removed from all environments and using it would burn funds, so every
    // cross-chain token movement here goes through callContractWithToken. Refunds are routed back
    // to the auction house on the source chain, which forwards them to the recipient. The leading
    // action tag lets the receiving auction house tell an incoming bid apart from an incoming refund.
    uint8 private constant ACTION_BID = 0;
    uint8 private constant ACTION_REFUND = 1;

    IAxelarGasService public immutable gasService;
    mapping(address => mapping(uint256 => address)) biddersRemote;
    mapping(address => mapping(uint256 => string)) sourceChains;
    mapping(address => mapping(uint256 => string)) sourceAuctionhouses;
    mapping(address => mapping(uint256 => address)) refundAddresses;

    constructor(address gateway_, address gasReceiver_, address usdc_) NftAuctionhouse(usdc_) AxelarExecutableWithToken(gateway_) {
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
        usdc.approve(address(gatewayWithToken()), amount);
        bytes memory payload = abi.encode(ACTION_BID, msg.sender, bidder, operator, tokenId);
        gasService.payNativeGasForContractCallWithToken{ value: msg.value }(
            address(this),
            destinationChain,
            destinationAuctionhouse,
            payload,
            'aUSDC',
            amount,
            msg.sender
        );
        gatewayWithToken().callContractWithToken(destinationChain, destinationAuctionhouse, payload, 'aUSDC', amount);
    }

    function _executeWithToken(
        bytes32 /*commandId*/,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload,
        string calldata tokenSymbol,
        uint256 amount
    ) internal override {
        uint8 action = abi.decode(payload, (uint8));

        if (action == ACTION_REFUND) {
            // A remote bid we placed was outbid or rejected; hand the returned tokens to the bidder.
            (, address recipient) = abi.decode(payload, (uint8, address));
            usdc.transfer(recipient, amount);
            return;
        }

        (, address refundAddress, address bidder, address operator, uint256 tokenId) = abi.decode(
            payload,
            (uint8, address, address, address, uint256)
        );
        (bool success, ) = address(this).call(abi.encodeWithSelector(this._bid.selector, address(this), operator, tokenId, amount));
        if (!success) {
            usdc.approve(address(gatewayWithToken()), amount);
            gatewayWithToken().callContractWithToken(sourceChain, sourceAddress, abi.encode(ACTION_REFUND, refundAddress), tokenSymbol, amount);
        } else {
            biddersRemote[operator][tokenId] = bidder;
            sourceChains[operator][tokenId] = sourceChain;
            sourceAuctionhouses[operator][tokenId] = sourceAddress;
            refundAddresses[operator][tokenId] = refundAddress;
        }
    }

    function _refundPrevBidder(address bidder, uint256 amount, address operator, uint256 tokenId) internal override {
        if (bidder == address(this)) {
            usdc.approve(address(gatewayWithToken()), amount);
            gatewayWithToken().callContractWithToken(
                sourceChains[operator][tokenId],
                sourceAuctionhouses[operator][tokenId],
                abi.encode(ACTION_REFUND, refundAddresses[operator][tokenId]),
                'aUSDC',
                amount
            );
        } else {
            usdc.transfer(bidder, amount);
        }
    }

    function _giveNft(address auctioneer, address lastBidder, address operator, uint256 tokenId, uint256 lastBid) internal override {
        usdc.transfer(auctioneer, lastBid);
        address actualBidder = lastBidder == address(this) ? biddersRemote[operator][tokenId] : lastBidder;

        IERC721(operator).transferFrom(address(this), actualBidder, tokenId);

        bidders[operator][tokenId] = address(0);
        bids[operator][tokenId] = 0;
    }

    function _execute(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal override {}
}
