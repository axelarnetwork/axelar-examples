'use strict';

const chai = require('chai');
const {
    utils: { defaultAbiCoder, keccak256, id },
    constants: { AddressZero },
} = require('ethers');
const { deployCreate3Upgradable } = require('@axelar-network/axelar-gmp-sdk-solidity/index');
const { expect } = chai;
const { ethers } = require('hardhat');

const NftLinkerProxy = require('../../artifacts/examples/evm/nft-linker/NftLinkerProxy.sol/NftLinkerProxy.json');
const NftLinkerLockUnlock = require('../../artifacts/examples/evm/nft-linker/NftLinkerLockUnlock.sol/NftLinkerLockUnlock.json');
const NftLinkerMintBurn = require('../../artifacts/examples/evm/nft-linker/NftLinkerMintBurn.sol/NftLinkerMintBurn.json');

const getRandomID = () => id(Math.floor(Math.random() * 1e10).toString());

describe.only('NftLinker', () => {
    let gatewayFactory;
    let gasServiceFactory;
    let tokenFactory;
    let create3DeployerFactory;

    let gateway;
    let gasService;
    let nftLinker;
    let token;
    let create3Deployer;

    let ownerWallet;
    let userWallet;

    const sourceChain = 'chainA';
    const destinationChain = 'chainB';
    const tokenName = 'testToken';
    const tokenSymbol = 'TEST';

    const approve = (payloadHash, commandId, txHash, txIndex) => {
        const approveData = defaultAbiCoder.encode(
            ['string', 'string', 'address', 'bytes32', 'bytes32', 'uint256'],
            [sourceChain, nftLinker.address, nftLinker.address, payloadHash, txHash, txIndex],
        );

        return gateway.approveContractCall(approveData, commandId);
    };

    before(async () => {
        [ownerWallet, userWallet] = await ethers.getSigners();

        gatewayFactory = await ethers.getContractFactory('MockGateway', ownerWallet);
        gasServiceFactory = await ethers.getContractFactory('MockGasService', ownerWallet);
        tokenFactory = await ethers.getContractFactory('ERC721MintableBurnable', ownerWallet);
        create3DeployerFactory = await ethers.getContractFactory('Create3Deployer', ownerWallet);
    });

    beforeEach(async () => {
        gateway = await gatewayFactory.deploy().then((d) => d.deployed());

        gasService = await gasServiceFactory.deploy().then((d) => d.deployed());

        create3Deployer = await create3DeployerFactory.deploy().then((d) => d.deployed());

        token = await tokenFactory.deploy(tokenName, tokenSymbol).then((d) => d.deployed());
    });

    describe('Lock-Unlock', () => {
        beforeEach(async () => {
            nftLinker = await deployCreate3Upgradable(create3Deployer.address, ownerWallet, NftLinkerLockUnlock, NftLinkerProxy, [
                gateway.address,
                gasService.address,
                token.address,
                ownerWallet.address,
            ]);
        });
        it('should lock nft', async () => {
            const tokenid = 1e6;
            await token.connect(userWallet).mint(userWallet.address, tokenid);
            await token.connect(userWallet).approve(nftLinker.address, tokenid);
            const payload = defaultAbiCoder.encode(['address', 'uint256'], [userWallet.address, tokenid]);
            const payloadHash = keccak256(payload);
            await expect(nftLinker.connect(userWallet).sendNft(destinationChain, userWallet.address, tokenid, userWallet.address))
                .to.emit(token, 'Transfer')
                .withArgs(userWallet.address, nftLinker.address, tokenid)
                .and.to.emit(gateway, 'ContractCall')
                .withArgs(nftLinker.address, destinationChain, nftLinker.address.toLowerCase(), payloadHash, payload);
        });
        it('should unlock nft', async () => {
            const tokenid = 1e5;
            const payload = defaultAbiCoder.encode(['address', 'uint256'], [userWallet.address, tokenid]);
            const payloadHash = keccak256(payload);
            const commandId = getRandomID();
            const txHash = getRandomID();
            const txIndex = 0;

            await (await token.connect(userWallet).mint(nftLinker.address, tokenid)).wait();

            await expect(approve(payloadHash, commandId, txHash, txIndex))
                .to.emit(gateway, 'ContractCallApproved')
                .withArgs(commandId, sourceChain, nftLinker.address, nftLinker.address, payloadHash, txHash, txIndex);

            await expect(nftLinker.connect(userWallet).execute(commandId, sourceChain, nftLinker.address, payload))
                .to.emit(token, 'Transfer')
                .withArgs(nftLinker.address, userWallet.address, tokenid);
        });
    });

    describe('Mint-Burn', () => {
        beforeEach(async () => {
            nftLinker = await deployCreate3Upgradable(create3Deployer.address, ownerWallet, NftLinkerMintBurn, NftLinkerProxy, [
                gateway.address,
                gasService.address,
                token.address,
                ownerWallet.address,
            ]);
        });
        it('should burn nft', async () => {
            const tokenid = 1e6;
            await token.connect(userWallet).mint(userWallet.address, tokenid);
            await token.connect(userWallet).approve(nftLinker.address, tokenid);
            const payload = defaultAbiCoder.encode(['address', 'uint256'], [userWallet.address, tokenid]);
            const payloadHash = keccak256(payload);

            await expect(nftLinker.connect(userWallet).sendNft(destinationChain, userWallet.address, tokenid, userWallet.address))
                .to.emit(token, 'Transfer')
                .withArgs(userWallet.address, AddressZero, tokenid)
                .and.to.emit(gateway, 'ContractCall')
                .withArgs(nftLinker.address, destinationChain, nftLinker.address.toLowerCase(), payloadHash, payload);
        });
        it('should mint nft', async () => {
            const tokenid = 1e6;
            const payload = defaultAbiCoder.encode(['address', 'uint256'], [userWallet.address, tokenid]);
            const payloadHash = keccak256(payload);
            const commandId = getRandomID();
            const txHash = getRandomID();
            const txIndex = 0;

            await expect(approve(payloadHash, commandId, txHash, txIndex))
                .to.emit(gateway, 'ContractCallApproved')
                .withArgs(commandId, sourceChain, nftLinker.address, nftLinker.address, payloadHash, txHash, txIndex);

            await expect(nftLinker.connect(userWallet).execute(commandId, sourceChain, nftLinker.address, payload))
                .to.emit(token, 'Transfer')
                .withArgs(AddressZero, userWallet.address, tokenid);
        });
    });
});
