// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { ERC721 } from '@openzeppelin/contracts/token/ERC721/ERC721.sol';

import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';

contract MultichainNFTMint is AxelarExecutable {
    IAxelarGasService public immutable gasService;
    ERC721 nft;

    constructor(address _gateway, address _gasService, address _nftAddr) AxelarExecutable(_gateway) {
        gasService = IAxelarGasService(_gasService);
        nft = ERC721(_nftAddr);
    }

    function mintNftOnDestChain(
        string memory _destChain,
        string memory _destContractAddr,
        address receivingAddr,
        uint256 _tokenId
    ) external payable {
        require(msg.value > 0, 'Gas payment required');

        bytes memory mintNftPayload = abi.encodeWithSignature('safeMint(address,uint256)', receivingAddr, _tokenId);

        //pay gas from source chain
        gasService.payNativeGasForContractCall{ value: msg.value }(
            address(this), //sender
            _destChain,
            _destContractAddr,
            mintNftPayload,
            msg.sender
        );

        gateway.callContract(_destChain, _destContractAddr, mintNftPayload);
    }

    function _execute(string calldata, string calldata, bytes calldata _payload) internal override {
        (bool success, ) = address(nft).call(_payload);
        require(success, 'safeMint() call failed');
    }
}
