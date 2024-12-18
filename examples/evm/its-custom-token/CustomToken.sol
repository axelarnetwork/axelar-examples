// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import { InterchainTokenStandard } from '@axelar-network/interchain-token-service/contracts/interchain-token/InterchainTokenStandard.sol';
import { IInterchainTokenService } from '@axelar-network/interchain-token-service/contracts/interfaces/IInterchainTokenService.sol';

// Any ERC20 implementation can be used here, we chose OZ since it is quite well known.
import { ERC20 } from '@openzeppelin/contracts/token/ERC20/ERC20.sol';

import { Minter } from '@axelar-network/interchain-token-service/contracts/utils/Minter.sol';

/**
 * @title CustomToken
 * @notice This contract implements a custom token which extends InterchainToken functionality.
 * @dev This contract also inherits Minter and Implementation logic.
 */
contract CustomToken is InterchainTokenStandard, ERC20, Minter {
    uint8 internal immutable decimals_;
    bytes32 internal itsSalt;
    address internal immutable interchainTokenService_;

    uint256 internal constant UINT256_MAX = 2 ** 256 - 1;
    address public deployer;

    /**
     * @notice Constructs the InterchainToken contract.
     * @dev Makes the implementation act as if it has been setup already to disallow calls to init() (even though that would not achieve anything really).
     */
    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimalsValue,
        address interchainTokenServiceAddress
    ) ERC20(name_, symbol_) {
        decimals_ = decimalsValue;
        interchainTokenService_ = interchainTokenServiceAddress;

        _addMinter(msg.sender);
        deployer = msg.sender;
    }

    function decimals() public view override returns (uint8) {
        return decimals_;
    }

    /**
     * @notice set ITS salt needed to calculate interchainTokenId
     * @param salt_ the salt being sent
     */
    function setItsSalt(bytes32 salt_) external onlyRole(uint8(Roles.MINTER)) {
        itsSalt = salt_;
    }

    /**
     * @notice Returns the interchain token service
     * @return address The interchain token service contract
     */
    function interchainTokenService() public view override returns (address) {
        return interchainTokenService_;
    }

    /**
     * @notice Returns the tokenId for this token.
     */
    function interchainTokenId() public view override returns (bytes32 tokenId) {
        tokenId = IInterchainTokenService(interchainTokenService_).interchainTokenId(deployer, itsSalt);
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

    function addMinter(address minter) external {
        _addMinter(minter);
    }

    /**
     * @notice A method to be overwritten that will decrease the allowance of the `spender` from `sender` by `amount`.
     * @dev Needs to be overwritten. This provides flexibility for the choice of ERC20 implementation used. Must revert if allowance is not sufficient.
     */
    function _spendAllowance(address sender, address spender, uint256 amount) internal override(ERC20, InterchainTokenStandard) {
        uint256 _allowance = allowance(sender, spender);

        if (_allowance != UINT256_MAX) {
            _approve(sender, spender, _allowance - amount);
        }
    }
}
