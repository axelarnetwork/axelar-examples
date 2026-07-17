// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';

interface INftMintable {
    function safeMint(address to, uint256 tokenId) external;
}

contract MultichainNFTMint is AxelarExecutable {
    IAxelarGasService public immutable gasService;
    INftMintable nft;

    constructor(address _gateway, address _gasService, address _nftAddr) AxelarExecutable(_gateway) {
        gasService = IAxelarGasService(_gasService);
        nft = INftMintable(_nftAddr);
    }

    function mintNftOnDestChain(
        string memory _destChain,
        string memory _destContractAddr,
        address receivingAddr,
        uint256 _tokenId
    ) external payable {
        require(msg.value > 0, 'Gas payment required');

        bytes memory mintNftPayload = abi.encode(receivingAddr, _tokenId);

        //pay gas from source chain
        gasService.payNativeGasForContractCall{ value: msg.value }(
            address(this), //sender
            _destChain,
            _destContractAddr,
            mintNftPayload,
            msg.sender
        );

        gateway().callContract(_destChain, _destContractAddr, mintNftPayload);
    }

    function _execute(bytes32 /*commandId*/, string calldata, string calldata, bytes calldata _payload) internal override {
        // Demo only — this handler does not authenticate the message source; in production validate
        // sourceChain/sourceAddress against a trusted sender before minting.
        (address to, uint256 tokenId) = abi.decode(_payload, (address, uint256));
        nft.safeMint(to, tokenId);
    }
}
