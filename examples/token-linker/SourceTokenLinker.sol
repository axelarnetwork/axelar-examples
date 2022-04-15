// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;


import { SourceToken } from "./SourceToken.sol";
import { TokenLinker } from "./TokenLinker.sol";

contract SourceTokenLinker is TokenLinker {
    constructor(address gateway_, address gasReceiver_, address token_) TokenLinker(gateway_, gasReceiver_, token_) {}

    function _collectToken(
        address from_,
        uint256 amount_
    ) internal override {
        SourceToken(token).transferFrom(from_, address(this), amount_);
    }

    function _giveToken(
        address to_,
        uint256 amount_
    ) internal override {
        SourceToken(token).transfer(to_, amount_);
    }
}