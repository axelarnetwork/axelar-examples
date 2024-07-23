// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import { InterchainTokenStandard } from '@axelar-network/interchain-token-service/contracts/interchain-token/InterchainTokenStandard.sol';
import { IInterchainTokenService } from '@axelar-network/interchain-token-service/contracts/interfaces/IInterchainTokenService.sol';
import { ERC20Burnable } from '@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol';
import { ERC20 } from '@openzeppelin/contracts/token/ERC20/ERC20.sol';

import { Minter } from '@axelar-network/interchain-token-service/contracts/utils/Minter.sol';

/**
 * @title InterchainToken
 * @notice This contract implements an interchain token which extends InterchainToken functionality.
 * @dev This contract also inherits Minter and Implementation logic.
 */
contract BurnableToken is InterchainTokenStandard, ERC20Burnable, Minter {
    address public deployer;
    bytes32 internal _itsSalt;
    uint8 internal immutable _decimals;
    // bytes32 internal _tokenId;
    address internal immutable _interchainTokenService;

    uint256 internal constant UINT256_MAX = 2 ** 256 - 1;

    /**
     * @notice Constructs the InterchainToken contract.
     * @dev Makes the implementation act as if it has been setup already to disallow calls to init() (even though that would not achieve anything really).
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 decimalsValue,
        address interchainTokenServiceAddress
    ) ERC20(_name, _symbol) {
        _decimals = decimalsValue;
        _interchainTokenService = interchainTokenServiceAddress;

        _addMinter(msg.sender);
        deployer = msg.sender;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /**
     * @notice Returns the interchain token service
     * @return address The interchain token service contract
     */
    function interchainTokenService() public view override returns (address) {
        return _interchainTokenService;
    }

    /**
     * @notice set ITS salt needed to calculate interchainTokenId
     * @param _salt the salt being sent
     */
    function setItsSalt(bytes32 _salt) external onlyRole(uint8(Roles.MINTER)) {
        _itsSalt = _salt;
    }

    /**
     * @notice Returns the tokenId for this token.
     * @return tokenId the token id.
     */
    function interchainTokenId() public view override returns (bytes32 tokenId) {
        tokenId = IInterchainTokenService(_interchainTokenService).interchainTokenId(deployer, _itsSalt);
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
     * @notice Burns a specific amount of tokens from the specified account.
     * @dev This function overrides the `burnFrom` method in the parent contract.
     *
     * Requirements:
     * - The caller must have allowance for the specified account's tokens of at least `amount`.
     *
     * @param account The address of the account whose tokens will be burned.
     * @param amount The amount of tokens to be burned.
     */
    function burnFrom(address account, uint256 amount) public override {
        super.burnFrom(account, amount);
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
