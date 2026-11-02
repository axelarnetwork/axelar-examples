// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';
import { SafeTokenTransfer, SafeTokenTransferFrom } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/libs/SafeTransfer.sol';
import { AxelarExecutableWithToken } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutableWithToken.sol';
import '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';
import './NftAuctionhouse.sol';

contract NftAuctionhouseRemote is NftAuctionhouse, AxelarExecutableWithToken {
    using SafeTokenTransfer for IERC20;
    using SafeTokenTransferFrom for IERC20;

    // sendToken has been disabled in all environments and might cause loss of funds if used, so every
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

        usdc.safeTransferFrom(msg.sender, address(this), amount);
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
        // Demo only — this shouldn't be used as-is in production: _executeWithToken does NOT
        // authenticate the message source, yet (unlike a pure token forwarder) it drives shared
        // auction state and escrowed funds — recording the bidder and refund routing, and placing
        // bids that refund the previous bidder from the contract's escrow. A forged or unauthenticated
        // message can therefore corrupt the auction (spoof bids, redirect refund routing), not merely
        // move its own tokens. In production, validate sourceChain/sourceAddress against the trusted
        // remote auction house before acting.
        if (abi.decode(payload, (uint8)) == ACTION_REFUND) {
            // A remote bid we placed was outbid or rejected; hand the returned tokens to the bidder.
            (, address recipient) = abi.decode(payload, (uint8, address));
            usdc.safeTransfer(recipient, amount);
            return;
        }

        (, address refundAddress, address bidder, address operator, uint256 tokenId) = abi.decode(
            payload,
            (uint8, address, address, address, uint256)
        );

        // The bid attempt and the refund call are factored into helpers to keep the number of
        // simultaneously-live locals in this function below the EVM stack limit ("stack too deep").
        if (_tryBid(operator, tokenId, amount)) {
            biddersRemote[operator][tokenId] = bidder;
            sourceChains[operator][tokenId] = sourceChain;
            sourceAuctionhouses[operator][tokenId] = sourceAddress;
            refundAddresses[operator][tokenId] = refundAddress;
        } else {
            _sendRefund(sourceChain, sourceAddress, refundAddress, tokenSymbol, amount);
        }
    }

    function _tryBid(address operator, uint256 tokenId, uint256 amount) private returns (bool success) {
        (success, ) = address(this).call(abi.encodeWithSelector(this._bid.selector, address(this), operator, tokenId, amount));
    }

    // Route a refund back to the auction house on the recipient's source chain (tagged ACTION_REFUND),
    // which forwards it to the recipient. `string memory` params so both callers work: calldata from
    // _executeWithToken and storage strings from _refundPrevBidder.
    function _sendRefund(
        string memory destinationChain,
        string memory destinationAuctionhouse,
        address recipient,
        string memory tokenSymbol,
        uint256 amount
    ) private {
        usdc.approve(address(gatewayWithToken()), amount);
        gatewayWithToken().callContractWithToken(destinationChain, destinationAuctionhouse, abi.encode(ACTION_REFUND, recipient), tokenSymbol, amount);
    }

    function _refundPrevBidder(address bidder, uint256 amount, address operator, uint256 tokenId) internal override {
        if (bidder == address(this)) {
            _sendRefund(sourceChains[operator][tokenId], sourceAuctionhouses[operator][tokenId], refundAddresses[operator][tokenId], 'aUSDC', amount);
        } else {
            usdc.safeTransfer(bidder, amount);
        }
    }

    function _giveNft(address auctioneer, address lastBidder, address operator, uint256 tokenId, uint256 lastBid) internal override {
        usdc.safeTransfer(auctioneer, lastBid);
        address actualBidder = lastBidder == address(this) ? biddersRemote[operator][tokenId] : lastBidder;

        IERC721(operator).transferFrom(address(this), actualBidder, tokenId);

        bidders[operator][tokenId] = address(0);
        bids[operator][tokenId] = 0;
        delete biddersRemote[operator][tokenId];
        delete sourceChains[operator][tokenId];
        delete sourceAuctionhouses[operator][tokenId];
        delete refundAddresses[operator][tokenId];
    }

    function _execute(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal override {}
}
