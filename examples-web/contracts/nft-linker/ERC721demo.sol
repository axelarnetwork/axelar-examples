// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

//A simple ERC721 that allows users to mint NFTs as they please.
contract ERC721Demo is ERC721URIStorage {
    mapping(string => uint8) private _hashes;
    mapping(uint256 => uint8) private _tokenIds;

    constructor(string memory name_, string memory symbol_)
        ERC721(name_, symbol_)
    {}

    function mint(uint256 tokenId) external {
        require(
            _tokenIds[tokenId] != 1,
            "token ID already exists"
        );
        _tokenIds[tokenId] = 1;
        _safeMint(_msgSender(), tokenId);
    }

    function mintWithMetadata(
        uint256 tokenId,
        string memory assetHash,
        string memory tokenURI
    ) external {
        require(
            _tokenIds[tokenId] != 1,
            "token ID already exists"
        );
        _tokenIds[tokenId] = 1;

        require(
            _hashes[assetHash] != 1,
            "hash already exists"
        );
        _hashes[assetHash] = 1;

        _safeMint(_msgSender(), tokenId);
        _setTokenURI(tokenId, tokenURI);
    }
}
