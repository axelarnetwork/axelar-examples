// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';

//A simple ERC721 that allows users to mint NFTs as they please.
contract ERC721Demo is ERC721 {
    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {}

    function mint(uint256 tokenId) external {
        _safeMint(_msgSender(), tokenId);
    }
}
