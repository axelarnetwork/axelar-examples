'use strict';

const chai = require('chai');
const {
    utils: { defaultAbiCoder, keccak256, id },
    constants: { AddressZero },
} = require('ethers');
const { deployCreate3Upgradable } = require('@axelar-network/axelar-gmp-sdk-solidity/index');

const { expect } = chai;
const { ethers } = require('hardhat');

const TokenLinkerProxy = require('../../artifacts/examples/evm/token-linker/TokenLinkerProxy.sol/TokenLinkerProxy.json');
const TokenLinkerLockUnlock = require('../../artifacts/examples/evm/token-linker/TokenLinkerLockUnlock.sol/TokenLinkerLockUnlock.json');
const TokenLinkerMintBurn = require('../../artifacts/examples/evm/token-linker/TokenLinkerMintBurn.sol/TokenLinkerMintBurn.json');
const TokenLinkerNative = require('../../artifacts/examples/evm/token-linker/TokenLinkerNative.sol/TokenLinkerNative.json');

const getRandomID = () => id(Math.floor(Math.random() * 1e10).toString());

describe('TokenLinker', () => {
    let gatewayFactory;
    let gasServiceFactory;
    let tokenFactory;
    let create3DeployerFactory;

    let gateway;
    let gasService;
    let tokenLinker;
    let token;
    let create3Deployer;

    let ownerWallet;
    let userWallet;

    const sourceChain = 'chainA';
    const destinationChain = 'chainB';
    const tokenName = 'testToken';
    const tokenSymbol = 'TEST';
    const decimals = 16;

    const approve = (payloadHash, commandId, txHash, txIndex) => {
        const approveData = defaultAbiCoder.encode(
            ['string', 'string', 'address', 'bytes32', 'bytes32', 'uint256'],
            [sourceChain, tokenLinker.address, tokenLinker.address, payloadHash, txHash, txIndex],
        );

        return gateway.approveContractCall(approveData, commandId);
    };

    before(async () => {
        [ownerWallet, userWallet] = await ethers.getSigners();

        gatewayFactory = await ethers.getContractFactory('MockGateway', ownerWallet);
        gasServiceFactory = await ethers.getContractFactory('MockGasService', ownerWallet);
        tokenFactory = await ethers.getContractFactory('ERC20MintableBurnable', ownerWallet);
        create3DeployerFactory = await ethers.getContractFactory('Create3Deployer', ownerWallet);
    });

    beforeEach(async () => {
        gateway = await gatewayFactory.deploy().then((d) => d.deployed());

        gasService = await gasServiceFactory.deploy().then((d) => d.deployed());

        create3Deployer = await create3DeployerFactory.deploy().then((d) => d.deployed());

        token = await tokenFactory.deploy(tokenName, tokenSymbol, decimals).then((d) => d.deployed());
    });

    describe('Lock-Unlock', () => {
        beforeEach(async () => {
            tokenLinker = await deployCreate3Upgradable(create3Deployer.address, ownerWallet, TokenLinkerLockUnlock, TokenLinkerProxy, [
                gateway.address,
                gasService.address,
                token.address,
            ]);
        });
        it('should lock token', async () => {
            const amount = 1e6;
            await token.connect(userWallet).mint(userWallet.address, amount);
            await token.connect(userWallet).approve(tokenLinker.address, amount);
            const payload = defaultAbiCoder.encode(['address', 'uint256'], [userWallet.address, amount]);
            const payloadHash = keccak256(payload);
            await expect(tokenLinker.connect(userWallet).sendToken(destinationChain, userWallet.address, amount, userWallet.address))
                .to.emit(token, 'Transfer')
                .withArgs(userWallet.address, tokenLinker.address, amount)
                .and.to.emit(gateway, 'ContractCall')
                .withArgs(tokenLinker.address, destinationChain, tokenLinker.address.toLowerCase(), payloadHash, payload);
        });
        it('should unlock token', async () => {
            const amount = 1e6;
            const payload = defaultAbiCoder.encode(['address', 'uint256'], [userWallet.address, amount]);
            const payloadHash = keccak256(payload);
            const commandId = getRandomID();
            const txHash = getRandomID();
            const txIndex = 0;

            await (await token.connect(userWallet).mint(tokenLinker.address, amount)).wait();

            await expect(approve(payloadHash, commandId, txHash, txIndex))
                .to.emit(gateway, 'ContractCallApproved')
                .withArgs(commandId, sourceChain, tokenLinker.address, tokenLinker.address, payloadHash, txHash, txIndex);

            await expect(tokenLinker.connect(userWallet).execute(commandId, sourceChain, tokenLinker.address, payload))
                .to.emit(token, 'Transfer')
                .withArgs(tokenLinker.address, userWallet.address, amount);
        });
    });

    describe('Mint-Burn', () => {
        beforeEach(async () => {
            tokenLinker = await deployCreate3Upgradable(create3Deployer.address, ownerWallet, TokenLinkerMintBurn, TokenLinkerProxy, [
                gateway.address,
                gasService.address,
                token.address,
            ]);
        });
        it('should burn token', async () => {
            const amount = 1e6;
            await token.connect(userWallet).mint(userWallet.address, amount);
            await token.connect(userWallet).approve(tokenLinker.address, amount);
            const payload = defaultAbiCoder.encode(['address', 'uint256'], [userWallet.address, amount]);
            const payloadHash = keccak256(payload);
            await expect(tokenLinker.connect(userWallet).sendToken(destinationChain, userWallet.address, amount, userWallet.address))
                .to.emit(token, 'Transfer')
                .withArgs(userWallet.address, AddressZero, amount)
                .and.to.emit(gateway, 'ContractCall')
                .withArgs(tokenLinker.address, destinationChain, tokenLinker.address.toLowerCase(), payloadHash, payload);
        });
        it('should mint token', async () => {
            const amount = 1e6;
            const payload = defaultAbiCoder.encode(['address', 'uint256'], [userWallet.address, amount]);
            const payloadHash = keccak256(payload);
            const commandId = getRandomID();
            const txHash = getRandomID();
            const txIndex = 0;

            await expect(approve(payloadHash, commandId, txHash, txIndex))
                .to.emit(gateway, 'ContractCallApproved')
                .withArgs(commandId, sourceChain, tokenLinker.address, tokenLinker.address, payloadHash, txHash, txIndex);

            await expect(tokenLinker.connect(userWallet).execute(commandId, sourceChain, tokenLinker.address, payload))
                .to.emit(token, 'Transfer')
                .withArgs(AddressZero, userWallet.address, amount);
        });
    });

    describe('Native', () => {
        beforeEach(async () => {
            tokenLinker = await deployCreate3Upgradable(create3Deployer.address, ownerWallet, TokenLinkerNative, TokenLinkerProxy, [
                gateway.address,
                gasService.address,
            ]);
        });
        it('should lock native token', async () => {
            const amount = 1e6;
            const payload = defaultAbiCoder.encode(['address', 'uint256'], [userWallet.address, amount]);
            const payloadHash = keccak256(payload);
            const linkerBalanceBefore = await tokenLinker.provider.getBalance(tokenLinker.address);
            await expect(
                tokenLinker.connect(userWallet).sendToken(destinationChain, userWallet.address, amount, userWallet.address, {
                    value: amount,
                }),
            )
                .to.emit(gateway, 'ContractCall')
                .withArgs(tokenLinker.address, destinationChain, tokenLinker.address.toLowerCase(), payloadHash, payload);

            const linkerBalanceAfter = await tokenLinker.provider.getBalance(tokenLinker.address);
            expect(linkerBalanceAfter - linkerBalanceBefore).to.equal(amount);
        });

        it('should unlock native token', async () => {
            const amount = 1e6;
            const payload = defaultAbiCoder.encode(['address', 'uint256'], [userWallet.address, amount]);
            const payloadHash = keccak256(payload);
            const commandId = getRandomID();
            const txHash = getRandomID();
            const txIndex = 0;

            await tokenLinker.connect(ownerWallet).updateBalance({ value: amount });

            await expect(approve(payloadHash, commandId, txHash, txIndex))
                .to.emit(gateway, 'ContractCallApproved')
                .withArgs(commandId, sourceChain, tokenLinker.address, tokenLinker.address, payloadHash, txHash, txIndex);

            const linkerBalanceBefore = await tokenLinker.provider.getBalance(tokenLinker.address);

            await (await tokenLinker.connect(userWallet).execute(commandId, sourceChain, tokenLinker.address, payload)).wait();

            const linkerBalanceAfter = await tokenLinker.provider.getBalance(tokenLinker.address);
            expect(linkerBalanceBefore - linkerBalanceAfter).to.equal(amount);
        });
    });
});
