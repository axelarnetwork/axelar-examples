// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import { InterchainTokenStandard } from '@axelar-network/interchain-token-service/contracts/interchain-token/InterchainTokenStandard.sol';
import { ERC20 } from '@openzeppelin/contracts/token/ERC20/ERC20.sol';

import { Minter } from '@axelar-network/interchain-token-service/contracts/utils/Minter.sol';

/**
 * @title FeeToken
 * @notice This contract implements an interchain token which extends InterchainToken functionality and extracts a fee for each transfer.
 * @dev This contract also inherits Minter and Implementation logic.
 */
contract FeeToken is InterchainTokenStandard, ERC20, Minter {
    uint8 internal immutable _decimals;
    bytes32 internal tokenId;
    address internal immutable _interchainTokenService;

    uint256 internal constant UINT256_MAX = 2 ** 256 - 1;

    uint256 public feePercent;

    /**
     * @notice Constructs the InterchainToken contract.
     * @dev Makes the implementation act as if it has been setup already to disallow calls to init() (even though that would not achieve anything really).
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimalsValue,
        uint256 _feePercent,
        address _interchainTokenServiceAddress
    ) ERC20(_name, _symbol) {
        _decimals = _decimalsValue;
        _interchainTokenService = _interchainTokenServiceAddress;

        feePercent = _feePercent;

        _addMinter(msg.sender);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /**
     * @notice set new fee percent
     * @param _feePercent new fee percent
     */
    function setFeePercent(uint256 _feePercent) external onlyRole(uint8(Roles.MINTER)) {
        require(_feePercent <= 100, 'Fee percent too high');
        feePercent = _feePercent;
    }

    /**
     * @notice Returns the interchain token service
     * @return address The interchain token service contract
     */
    function interchainTokenService() public view override returns (address) {
        return _interchainTokenService;
    }

    /**
     * @notice Returns the tokenId for this token.
     * @return bytes32 The token manager contract.
     */
    function interchainTokenId() public view override returns (bytes32) {
        return tokenId;
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
     * @notice transfer token from sender to recipient. Sender must approve tx to be sent
     * @param from sender of the token
     * @param to recipient of the token
     * @param amount amount of tokens to be sent
     */
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        uint256 fee = (amount * feePercent) / 1e18;
        uint256 amountAfterFee = amount - fee;

        super.transferFrom(from, to, amountAfterFee);

        _burn(from, fee);

        return true;
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
