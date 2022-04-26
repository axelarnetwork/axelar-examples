// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import { AxelarGasReceiver } from '@axelar-network/axelar-cgp-solidity/src/gas-receiver/AxelarGasReceiver.sol';
import { IAxelarExecutable } from '@axelar-network/axelar-cgp-solidity/src/interfaces/IAxelarExecutable.sol';
import { IERC20 } from '@axelar-network/axelar-cgp-solidity/src/interfaces/IERC20.sol';

contract NftLinker is ERC721, IAxelarExecutable {
    mapping(uint256 => bytes) public original; //abi.encode(originaChain, operator, tokenId);
    mapping(string => string) public linkers; //Who we trust.
    string chainName;   //To check if we are the source chain.
    AxelarGasReceiver gasReceiver;


    //Contructor that initializes the ERC721 portion of our linker as well as knows where the gateway and gasReceiver are.
    constructor(string memory chainName_, address gateway_, address gasReceiver_) 
    ERC721('Axelar NFT Linker', 'ANL') 
    IAxelarExecutable(gateway_) {
        chainName = chainName_;
        gasReceiver = AxelarGasReceiver(gasReceiver_);
    }

    //Used to add linkers. This should be only callably by trusted sources normally.
    function addLinker(string memory chain, string memory linker) external {
        linkers[chain] = linker;
    }

    //The main function users will interract with.
    function sendNFT(
        address operator, 
        uint256 tokenId, 
        string memory destinationChain, 
        address destinationAddress
    ) external payable {
        //If we are the operator then this is a minted token that lives remotely.
        if(operator == address(this)) {
            require(ownerOf(tokenId) == _msgSender(), 'NOT_YOUR_TOKEN');
            _sendMintedToken(tokenId, destinationChain, destinationAddress);
        } else {
            IERC721(operator).transferFrom(_msgSender(), address(this), tokenId);
            _sendNativeToken(operator, tokenId, destinationChain, destinationAddress);
        }
    }

    //Burns and sends a token.
    function _sendMintedToken(
        uint256 tokenId, 
        string memory destinationChain, 
        address destinationAddress
    ) internal {
        _burn(tokenId);
        //Get the original information.
        (
            string memory originalChain,
            address operator,
            uint256 originalTokenId
        ) = abi.decode(original[tokenId], (string, address, uint256));
        //Create the payload.
        bytes memory payload = abi.encode(originalChain, operator, originalTokenId, destinationAddress);
        //Pay for gas. We could also send the contract call here but then the sourceAddress will be that of the gas receiver which is a problem later.
        gasReceiver.payNativeGasForContractCall{value:msg.value}(
            address(this),
            destinationChain, 
            linkers[destinationChain], 
            payload,
            msg.sender
        );
        //Call the remote contract.
        gateway.callContract(
            destinationChain, 
            linkers[destinationChain], 
            payload
        );
    }
    //Locks and sends a token.
    function _sendNativeToken(
        address operator, 
        uint256 tokenId, 
        string memory destinationChain, 
        address destinationAddress
    ) internal {
        //Create the payload.
        bytes memory payload = abi.encode(chainName, operator, tokenId, destinationAddress);
        //Pay for gas. We could also send the contract call here but then the sourceAddress will be that of the gas receiver which is a problem later.
        gasReceiver.payNativeGasForContractCall{value: msg.value}(
            address(this),
            destinationChain, 
            linkers[destinationChain], 
            payload,
            msg.sender
        );
        //Call remote contract.
        gateway.callContract(
            destinationChain, 
            linkers[destinationChain], 
            payload
        );
    }

    //This is automatically executed by Axelar Microservices since gas was payed for.
    function _execute(string memory sourceChain, string memory sourceAddress, bytes calldata payload) internal override {
        //Check that the sender is another token linker.
        require(keccak256(bytes(sourceAddress)) == keccak256(bytes(linkers[sourceChain])), 'NOT_A_LINKER');
        //Decode the payload.
        (
            string memory originalChain,
            address operator,
            uint256 tokenId,
            address destinationAddress
        ) = abi.decode(payload, (string, address ,uint256, address));
        //If this is the original chain then we give the NFT locally.
        if(keccak256(bytes(originalChain)) == keccak256(bytes(chainName))) {
            IERC721(operator).transferFrom(address(this), destinationAddress, tokenId);
        //Otherwise we need to mint a new one.
        } else {
            //We need to save all the relevant information.
            bytes memory originalData = abi.encode(originalChain, operator, tokenId);
            //Avoids tokenId collisions.
            uint256 newTokenId = uint256(keccak256(originalData));
            original[newTokenId] = originalData;
            _safeMint(destinationAddress, newTokenId);
        }
    }
}