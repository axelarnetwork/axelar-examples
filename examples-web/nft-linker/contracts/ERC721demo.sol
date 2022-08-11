// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';

//A simple ERC721 that allows users to mint NFTs as they please.
contract ERC721Demo is ERC721URIStorage {
    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {}

    function mint(uint256 tokenId) external {
        _safeMint(_msgSender(), tokenId);
    }

    function mintWithMetadata(uint256 tokenId, string memory _tokenURI) external {
        _safeMint(_msgSender(), tokenId);
        _setTokenURI(tokenId, _tokenURI);
    }
}
