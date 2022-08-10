// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import { AxelarExecutable } from '@axelar-network/axelar-utils-solidity/contracts/executables/AxelarExecutable.sol';
import { IAxelarGateway } from '@axelar-network/axelar-utils-solidity/contracts/interfaces/IAxelarGateway.sol';
import { StringToAddress, AddressToString } from '@axelar-network/axelar-utils-solidity/contracts/StringAddressUtils.sol';
import { IERC20 } from '@axelar-network/axelar-cgp-solidity/contracts/interfaces/IERC20.sol';
import { IAxelarGasService } from '@axelar-network/axelar-cgp-solidity/contracts/interfaces/IAxelarGasService.sol';

contract NftLinkingReceiver is ERC721, AxelarExecutable {
    using StringToAddress for string;
    using AddressToString for address;

    error AlreadyInitialized();

    mapping(uint256 => bytes) public original; //abi.encode(originaChain, operator, tokenId);
    string public chainName; //To check if we are the source chain.
    IAxelarGateway _gateway;

    constructor() ERC721('Axelar NFT Linking Receiver', 'ANLR') {}

    function init(
        string memory chainName_,
        address gateway_
    ) external {
        if (address(gateway()) != address(0)) revert AlreadyInitialized();
        _gateway = IAxelarGateway(gateway_);
        chainName = chainName_;
    }
      
    function gateway() public view override returns (IAxelarGateway) {
        return _gateway;
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
        (string memory originalChain, address operator, uint256 tokenId, address destinationAddress) = abi.decode(
            payload,
            (string, address, uint256, address)
        );
        //If this is the original chain then we give the NFT locally.
        if (keccak256(bytes(originalChain)) == keccak256(bytes(chainName))) {
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
