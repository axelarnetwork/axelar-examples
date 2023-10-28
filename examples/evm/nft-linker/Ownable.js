'use strict';

const chai = require('chai');
const { expect } = chai;
const { ethers } = require('hardhat');
const {
  constants: { AddressZero },
} = require('ethers');

describe('Ownable', () => {
  let ownableTestFactory;
  let ownableTest;

  let ownerWallet;
  let userWallet;

  before(async () => {
    [ownerWallet, userWallet] = await ethers.getSigners();

    ownableTestFactory = await ethers.getContractFactory(
      'TestOwnable',
      ownerWallet,
    );
  });

  beforeEach(async () => {
    ownableTest = await ownableTestFactory
      .deploy(ownerWallet.address)
      .then((d) => d.deployed());
  });

  it('should set the initial owner and return the current owner address', async () => {
    const currentOwner = await ownableTest.owner();

    expect(currentOwner).to.equal(ownerWallet.address);
  });

  it('should revert when non-owner calls only owner function', async () => {
    const num = 5;

    await expect(
      ownableTest.connect(userWallet).setNum(num),
    ).to.be.revertedWithCustomError(ownableTest, 'NotOwner');
  });

  it('should not revert when owner calls only owner function', async () => {
    const num = 5;

    await expect(ownableTest.connect(ownerWallet).setNum(num))
      .to.emit(ownableTest, 'NumAdded')
      .withArgs(num);
  });

  it('should revert on transfer owner if not called by the current owner', async () => {
    const newOwner = userWallet.address;

    await expect(
      ownableTest.connect(userWallet).transferOwnership(newOwner),
    ).to.be.revertedWithCustomError(ownableTest, 'NotOwner');
  });

  it('should revert on transfer owner if new owner address is invalid', async () => {
    const newOwner = AddressZero;

    await expect(
      ownableTest.connect(ownerWallet).transferOwnership(newOwner),
    ).to.be.revertedWithCustomError(ownableTest, 'InvalidOwnerAddress');
  });

  it('should transfer ownership in one step', async () => {
    const newOwner = userWallet.address;

    await expect(ownableTest.transferOwnership(newOwner))
      .to.emit(ownableTest, 'OwnershipTransferred')
      .withArgs(newOwner);

    const currentOwner = await ownableTest.owner();

    expect(currentOwner).to.equal(userWallet.address);
  });

  it('should revert on propose owner if not called by the current owner', async () => {
    const newOwner = userWallet.address;

    await expect(
      ownableTest.connect(userWallet).proposeOwnership(newOwner),
    ).to.be.revertedWithCustomError(ownableTest, 'NotOwner');
  });

  it('should propose new owner', async () => {
    const newOwner = userWallet.address;

    await expect(ownableTest.proposeOwnership(newOwner))
      .to.emit(ownableTest, 'OwnershipTransferStarted')
      .withArgs(newOwner);
  });

  it('should return pending owner', async () => {
    const newOwner = userWallet.address;

    await expect(ownableTest.proposeOwnership(newOwner))
      .to.emit(ownableTest, 'OwnershipTransferStarted')
      .withArgs(newOwner);

    const pendingOwner = await ownableTest.pendingOwner();

    expect(pendingOwner).to.equal(userWallet.address);
  });

  it('should revert on accept ownership if caller is not the pending owner', async () => {
    const newOwner = userWallet.address;

    await expect(ownableTest.proposeOwnership(newOwner))
      .to.emit(ownableTest, 'OwnershipTransferStarted')
      .withArgs(newOwner);

    await expect(
      ownableTest.connect(ownerWallet).acceptOwnership(),
    ).to.be.revertedWithCustomError(ownableTest, 'InvalidOwner');
  });

  it('should accept ownership', async () => {
    const newOwner = userWallet.address;

    await expect(ownableTest.proposeOwnership(newOwner))
      .to.emit(ownableTest, 'OwnershipTransferStarted')
      .withArgs(newOwner);

    await expect(ownableTest.connect(userWallet).acceptOwnership())
      .to.emit(ownableTest, 'OwnershipTransferred')
      .withArgs(newOwner);

    const currentOwner = await ownableTest.owner();

    expect(currentOwner).to.equal(userWallet.address);
  });

  it('should revert on accept ownership if transfer ownership is called first', async () => {
    const newOwner = userWallet.address;

    await expect(ownableTest.proposeOwnership(newOwner))
      .to.emit(ownableTest, 'OwnershipTransferStarted')
      .withArgs(newOwner);

    await expect(ownableTest.transferOwnership(newOwner))
      .to.emit(ownableTest, 'OwnershipTransferred')
      .withArgs(newOwner);

    const currentOwner = await ownableTest.owner();

    expect(currentOwner).to.equal(userWallet.address);

    await expect(
      ownableTest.connect(userWallet).acceptOwnership(),
    ).to.be.revertedWithCustomError(ownableTest, 'InvalidOwner');
  });
});
