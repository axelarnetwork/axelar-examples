// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import { AxelarExecutable } from '@axelar-network/axelar-utils-solidity/contracts/executables/AxelarExecutable.sol';
import { IAxelarGateway } from '@axelar-network/axelar-utils-solidity/contracts/interfaces/IAxelarGateway.sol';
import { StringToAddress, AddressToString } from '@axelar-network/axelar-utils-solidity/contracts/StringAddressUtils.sol';
import { IERC20 } from '@axelar-network/axelar-cgp-solidity/contracts/interfaces/IERC20.sol';
import { IAxelarGasService } from '@axelar-network/axelar-cgp-solidity/contracts/interfaces/IAxelarGasService.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol';

contract NftLinker is ERC721URIStorage, AxelarExecutable {
    using StringToAddress for string;
    using AddressToString for address;

    error AlreadyInitialized();

    mapping(uint256 => bytes) public original; //abi.encode(originaChain, operator, tokenId);
    string public chainName; //To check if we are the source chain.
    IAxelarGasService public gasReceiver;
    IAxelarGateway _gateway;

    constructor() ERC721('Axelar NFT Linker', 'ANL') {}

    function init(
        string memory chainName_,
        address gateway_,
        address gasReceiver_
    ) external {
        if (address(gateway()) != address(0) || address(gasReceiver) != address(0)) revert AlreadyInitialized();
        gasReceiver = IAxelarGasService(gasReceiver_);
        _gateway = IAxelarGateway(gateway_);
        chainName = chainName_;
    }
      
    function gateway() public view override returns (IAxelarGateway) {
        return _gateway;
    }

    //The main function users will interract with.
    function sendNFT(
        address operator,
        uint256 tokenId,
        string memory destinationChain,
        address destinationAddress
    ) external payable {
        //If we are the operator then this is a minted token that lives remotely.
        if (operator == address(this)) {
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
        (string memory originalChain, address operator, uint256 originalTokenId, string memory tokenURI) = abi.decode(
            original[tokenId],
            (string, address, uint256, string)
        );
        //Create the payload.
        bytes memory payload = abi.encode(originalChain, operator, originalTokenId, destinationAddress, tokenURI);
        string memory stringAddress = address(this).toString();
        //Pay for gas. We could also send the contract call here but then the sourceAddress will be that of the gas receiver which is a problem later.
        gasReceiver.payNativeGasForContractCall{ value: msg.value }(address(this), destinationChain, stringAddress, payload, msg.sender);
        //Call the remote contract.
        gateway().callContract(destinationChain, stringAddress, payload);
    }

    //Locks and sends a token.
    function _sendNativeToken(
        address operator,
        uint256 tokenId,
        string memory destinationChain,
        address destinationAddress
    ) internal {
        string memory tokenURI = IERC721Metadata(operator).tokenURI(tokenId);
        //Create the payload.
        bytes memory payload = abi.encode(chainName, operator, tokenId, destinationAddress, tokenURI);
        string memory stringAddress = address(this).toString();
        //Pay for gas. We could also send the contract call here but then the sourceAddress will be that of the gas receiver which is a problem later.
        gasReceiver.payNativeGasForContractCall{ value: msg.value }(address(this), destinationChain, stringAddress, payload, msg.sender);
        //Call remote contract.
        gateway().callContract(destinationChain, stringAddress, payload);
    }

    //This is automatically executed by Axelar Microservices since gas was payed for.
    function _execute(
        string calldata, /*sourceChain*/
        string calldata sourceAddress,
        bytes calldata payload
    ) internal override {
        //Check that the sender is another token linker.
        require(sourceAddress.toAddress() == address(this), 'NOT_A_LINKER');
        //Decode the payload.
        (string memory originalChain, address operator, uint256 tokenId, address destinationAddress, string memory tokenURI) = abi.decode(
            payload,
            (string, address, uint256, address, string)
        );
        //If this is the original chain then we give the NFT locally.
        if (keccak256(bytes(originalChain)) == keccak256(bytes(chainName))) {
            IERC721(operator).transferFrom(address(this), destinationAddress, tokenId);
            //Otherwise we need to mint a new one.
        } else {
            //We need to save all the relevant information.
            bytes memory originalData = abi.encode(originalChain, operator, tokenId, tokenURI);
            //Avoids tokenId collisions.
            uint256 newTokenId = uint256(keccak256(originalData));
            original[newTokenId] = originalData;
            _safeMint(destinationAddress, newTokenId);
            _setTokenURI(newTokenId, tokenURI);
        }
    }
}
