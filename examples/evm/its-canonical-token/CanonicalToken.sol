// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import { ERC20 } from '@openzeppelin/contracts/token/ERC20/ERC20.sol';

import { Minter } from '@axelar-network/interchain-token-service/contracts/utils/Minter.sol';

/**
 * @title InterchainToken
 * @notice This contract implements an interchain token which extends InterchainToken functionality.
 * @dev This contract also inherits Minter and Implementation logic.
 */
contract CanonicalToken is ERC20, Minter {
    uint8 internal immutable _decimals;

    uint256 internal constant UINT256_MAX = 2 ** 256 - 1;

    /**
     * @notice Constructs the InterchainToken contract.
     * @dev Makes the implementation act as if it has been setup already to disallow calls to init() (even though that would not achieve anything really).
     */
    constructor(string memory _name, string memory _symbol, uint8 _decimalsValue) ERC20(_name, _symbol) {
        _decimals = _decimalsValue;
        _addMinter(msg.sender);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /**
     * @notice Function to mint new tokens.
     * @dev Can only be called by the minter address.
     * @param account The address that will receive the minted tokens.
     * @param amount The amount of tokens to mint.
     */
    function mint(address account, uint256 amount) external onlyRole(uint8(Roles.MINTER)) {
        _mint(account, amount);
    }

    /**
     * @notice Function to burn tokens.
     * @dev Can only be called by the minter address.
     * @param account The address that will have its tokens burnt.
     * @param amount The amount of tokens to burn.
     */
    function burn(address account, uint256 amount) external onlyRole(uint8(Roles.MINTER)) {
        _burn(account, amount);
    }
}
