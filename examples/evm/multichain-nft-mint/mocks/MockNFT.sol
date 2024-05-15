// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';

contract MockNFT is ERC721 {
    constructor() ERC721('MockNFT', 'MOCK') {}

    function safeMint(address to, uint256 tokenId) external {
        _safeMint(to, tokenId);
    }
}
