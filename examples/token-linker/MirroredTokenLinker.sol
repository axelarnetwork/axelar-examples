// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import { MirroredToken } from "./MirroredToken.sol";
import { TokenLinker } from "./TokenLinker.sol";

contract MirroredTokenLinker is TokenLinker {
    constructor(
        address gateway_,
        address gasReceiver_,
        string memory name_,
        string memory symbol_
    ) TokenLinker(gateway_, gasReceiver_, address(new MirroredToken(name_, symbol_))) {}
    
    function _collectToken(
        address from_,
        uint256 amount_
    ) internal override {
        // Burn token from caller.
        MirroredToken(token).burn(from_, amount_);
    }

    function _giveToken(
        address to_,
        uint256 amount_
    ) internal override {
        // Mint token to destination.
        MirroredToken(token).mint(to_, amount_);
    }
}