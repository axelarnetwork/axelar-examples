// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol';
import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';
import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import { Upgradable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/upgradable/Upgradable.sol';
import { StringToAddress, AddressToString } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/libs/AddressString.sol';

/**
 * @title NFTLinker
 * @notice Bridge NFTs from src chain to dest chain and back to src chain
 */
contract NftLinker is ERC721URIStorage, AxelarExecutable, Upgradable {
    using StringToAddress for string;
    using AddressToString for address;

    string public chainName; //To check if we are the source chain.
    IAxelarGasService public immutable gasService;

    bytes32 internal constant CONTRACT_ID = keccak256('token-linker');

    mapping(uint256 => bytes) public original; //abi.encode(originaChain, _operator, _tokenId);

    error AlreadyInitialized();

    /**
     *
     * @param _gateway address of axl gateway on deployed chain
     * @param _gasReceiver address of axl gas service on deployed chain
     */
    constructor(address _gateway, address _gasReceiver) ERC721('Axelar NFT Linker', 'ANL') AxelarExecutable(_gateway) {
        gasService = IAxelarGasService(_gasReceiver);
    }

    function _setup(bytes calldata params) internal override {
        string memory chainName_ = abi.decode(params, (string));
        if (bytes(chainName).length != 0) revert AlreadyInitialized();
        chainName = chainName_;
    }

    function contractId() external pure returns (bytes32) {
        return CONTRACT_ID;
    }

    /**
     * @notice send nft from src chain to dest chain
     * @param _operator contract handling the nft briding
     * @param _tokenId id of the token being sent
     * @param _destinationChain name of the dest chain
     * @param _destinationAddress address on dest chain tx is going to
     */
    function sendNFT(address _operator, uint256 _tokenId, string memory _destinationChain, address _destinationAddress) external payable {
        //If we are the _operator then this is a minted token that lives remotely.
        if (_operator == address(this)) {
            require(ownerOf(_tokenId) == _msgSender(), 'NOT_YOUR_TOKEN');
            _sendMintedToken(_tokenId, _destinationChain, _destinationAddress);
        } else {
            IERC721(_operator).transferFrom(_msgSender(), address(this), _tokenId);
            _sendNativeToken(_operator, _tokenId, _destinationChain, _destinationAddress);
        }
    }

    /**
     * @notice Burns and sends interchain nft tx
     * @dev Used when sending nft back to origin chain
     * @param _tokenId id of nft to be bridged
     * @param _destinationChain name of the dest chain
     * @param _destinationAddress address on dest chain tx is going to
     */
    function _sendMintedToken(uint256 _tokenId, string memory _destinationChain, address _destinationAddress) internal {
        _burn(_tokenId);

        //Get the original information.
        (string memory originalChain, address operator, uint256 originalTokenId, string memory tokenURI) = abi.decode(
            original[_tokenId],
            (string, address, uint256, string)
        );
        //Create the payload.
        bytes memory payload = abi.encode(originalChain, operator, originalTokenId, _destinationAddress, tokenURI);
        string memory stringAddress = address(this).toString();
        //Pay for gas. We could also send the contract call here but then the _sourceAddress will be that of the gas receiver which is a problem later.
        gasService.payNativeGasForContractCall{ value: msg.value }(address(this), _destinationChain, stringAddress, payload, msg.sender);
        //Call the remote contract.
        gateway().callContract(_destinationChain, stringAddress, payload);
    }

    /**
     * @notice Locks and sends a token from src to dest chain.
     * @dev Used when sending from original chain to dest
     * @param _operator contract handling the nft briding
     * @param _tokenId id of nft to be bridged
     * @param _destinationChain name of the dest chain
     * @param _destinationAddress address on dest chain tx is going to
     */
    function _sendNativeToken(address _operator, uint256 _tokenId, string memory _destinationChain, address _destinationAddress) internal {
        string memory tokenURI = IERC721Metadata(_operator).tokenURI(_tokenId);

        //Create the payload.
        bytes memory payload = abi.encode(chainName, _operator, _tokenId, _destinationAddress, tokenURI);
        string memory stringAddress = address(this).toString();
        //Pay for gas. We could also send the contract call here but then the _sourceAddress will be that of the gas receiver which is a problem later.
        gasService.payNativeGasForContractCall{ value: msg.value }(address(this), _destinationChain, stringAddress, payload, msg.sender);
        //Call remote contract.

        gateway().callContract(_destinationChain, stringAddress, payload);
    }

    /**
     * @notice logic to be executed on dest chain
     * @dev this is triggered automatically by relayer since gas was paid for
     * @param
     * @param
     * @param _sourceAddress address on src chain where tx is originating from
     * @param _payload encoded gmp message sent from src chain
     */
    function _execute(
        bytes32 /*commandId*/,
        string calldata /*sourceChain*/,
        string calldata _sourceAddress,
        bytes calldata _payload
    ) internal override {
        //Check that the sender is another token linker.

        require(_sourceAddress.toAddress() == address(this), 'NOT_A_LINKER');
        //Decode the payload.
        (string memory originalChain, address operator, uint256 tokenId, address destinationAddress, string memory tokenURI) = abi.decode(
            _payload,
            (string, address, uint256, address, string)
        );
        //If this is the original chain then we give the NFT locally.
        if (keccak256(bytes(originalChain)) == keccak256(bytes(chainName))) {
            IERC721(operator).transferFrom(address(this), destinationAddress, tokenId);
            //Else we need to mint a new one.
        } else {
            //We need to save all the relevant information.
            bytes memory originalData = abi.encode(originalChain, operator, tokenId, tokenURI);
            //Avoids _tokenId collisions.
            uint256 newTokenId = uint256(keccak256(originalData));
            original[newTokenId] = originalData;
            _safeMint(destinationAddress, newTokenId);
            _setTokenURI(newTokenId, tokenURI);
        }
    }
}
