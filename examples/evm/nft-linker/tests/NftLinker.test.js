const { utils } = require('ethers');
const { createNetwork, relay, deployContract } = require('@axelar-network/axelar-local-dev');
const NftLinker = require('../../../../artifacts/examples/evm/nft-linker/NftLinker.sol/NftLinker.json');
const NftLinkerProxy = require('../../../../artifacts/examples/evm/nft-linker/NftLinkerProxy.sol/NftLinkerProxy.json');
const ERC721 = require('../../../../artifacts/examples/evm/nft-linker/ERC721Demo.sol/ERC721Demo.json');

const { expect } = require('chai');
const { deployUpgradable } = require('@axelar-network/axelar-gmp-sdk-solidity');

describe('NFT Linker', async () => {
    let polygon;
    let avalanche;

    let polygonUserWallet;
    let avalancheUserWallet;

    let deployedNftPolygon;

    let nftLinkerPolygon;
    let nftLinkerAvalanche;

    let tokenURI;
    let tokenId;
    let key;

    before(async () => {
        // Initialize a Polygon network
        polygon = await createNetwork({
            name: 'Polygon',
        });

        // Initialize an Avalanche network
        avalanche = await createNetwork({
            name: 'Avalanche',
        });

        // Extract user wallets for both networks
        [polygonUserWallet] = polygon.userWallets;
        [avalancheUserWallet] = avalanche.userWallets;

        deployedNftPolygon = await deployContract(polygonUserWallet, ERC721, ['Something Funny', 'SF']);
        tokenId = 1;
    });

    describe('src chain', async () => {
        beforeEach(async () => {
            tokenId += 1;
            const hash = utils.keccak256(utils.toUtf8Bytes(tokenId.toString()));

            nftLinkerPolygon = await deployUpgradable(
                polygon.constAddressDeployer.address,
                polygonUserWallet,
                NftLinker,
                NftLinkerProxy,
                [polygon.gateway.address, polygon.gasService.address],
                [],
                utils.defaultAbiCoder.encode(['string'], [polygon.name]),
                key,
            );

            tokenURI = `https://ipfs.io/ipfs/${hash}`;

            await deployedNftPolygon.mintWithMetadata(tokenId, hash, tokenURI);
            await deployedNftPolygon.approve(nftLinkerPolygon.address, tokenId);

            nftLinkerAvalanche = await deployUpgradable(
                avalanche.constAddressDeployer.address,
                avalancheUserWallet,
                NftLinker,
                NftLinkerProxy,
                [avalanche.gateway.address, avalanche.gasService.address],
                [],
                utils.defaultAbiCoder.encode(['string'], [avalanche.name]),
                key,
            );
        });
        afterEach(async () => {
            key = new Date().getMilliseconds().toString();
            await relay();
        });
        it('should set correct gateway and gas service addresses on src chain', async () => {
            expect(await nftLinkerPolygon.gateway()).to.equal(polygon.gateway.address);
            expect(await nftLinkerPolygon.gasService()).to.equal(polygon.gasService.address);
        });
        it('should set correct chain name', async () => {
            expect(await nftLinkerPolygon.chainName()).to.equal(polygon.name);
        });
        it('should deduct nft from sender', async () => {
            const nftBalanceBefore = await deployedNftPolygon.balanceOf(polygonUserWallet.address);
            await nftLinkerPolygon.sendNFT(deployedNftPolygon.address, tokenId, avalanche.name, avalancheUserWallet.address, {
                value: (1e18).toString(),
            });
            const nftBalanceAfter = await deployedNftPolygon.balanceOf(polygonUserWallet.address);
            expect(nftBalanceAfter).to.equal(nftBalanceBefore - 1);
        });
        it('should lock nft at linker', async () => {
            const nftBalanceBefore = await deployedNftPolygon.balanceOf(nftLinkerPolygon.address);
            await nftLinkerPolygon.sendNFT(deployedNftPolygon.address, tokenId, avalanche.name, avalancheUserWallet.address, {
                value: (1e18).toString(),
            });
            const nftBalanceAfter = await deployedNftPolygon.balanceOf(nftLinkerPolygon.address);
            expect(nftBalanceAfter).to.equal(nftBalanceBefore + 1);
        });
        it('should successfully trigger interchain tx', async () => {
            const payload = utils.defaultAbiCoder.encode(
                ['string', 'address', 'uint256', 'address', 'string'],
                [polygon.name, deployedNftPolygon.address, tokenId, avalancheUserWallet.address, tokenURI],
            );

            const hashedPayload = utils.keccak256(payload);

            await expect(
                nftLinkerPolygon.sendNFT(deployedNftPolygon.address, tokenId, avalanche.name, avalancheUserWallet.address, {
                    value: (1e18).toString(),
                }),
            )
                .to.emit(polygon.gateway, 'ContractCall')
                .withArgs(nftLinkerPolygon.address, avalanche.name, nftLinkerAvalanche.address.toLowerCase(), hashedPayload, payload);
        });
        it('should pay gas via axelar gas service', async () => {
            const payload = utils.defaultAbiCoder.encode(
                ['string', 'address', 'uint256', 'address', 'string'],
                [polygon.name, deployedNftPolygon.address, tokenId, avalancheUserWallet.address, tokenURI],
            );
            const hashedPayload = utils.keccak256(payload);
            await expect(
                nftLinkerPolygon.sendNFT(deployedNftPolygon.address, tokenId, avalanche.name, avalancheUserWallet.address, {
                    value: (1e18).toString(),
                }),
            )
                .to.emit(polygon.gasService, 'NativeGasPaidForContractCall')
                .withArgs(
                    nftLinkerPolygon.address,
                    avalanche.name,
                    nftLinkerAvalanche.address.toLowerCase(),
                    hashedPayload,
                    (1e18).toString(),
                    polygonUserWallet.address,
                );
        });
        it('should return nft to original sender', async () => {
            const payload = utils.defaultAbiCoder.encode(
                ['string', 'address', 'uint256', 'string'],
                [polygon.name, deployedNftPolygon.address, tokenId, tokenURI],
            );
            const tokenIdAvalanche = utils.keccak256(payload);

            //SEND TO DEST
            await nftLinkerPolygon.sendNFT(deployedNftPolygon.address, tokenId, avalanche.name, avalancheUserWallet.address, {
                value: (1e18).toString(),
            });

            const balanaceSrcBefore = await deployedNftPolygon.balanceOf(polygonUserWallet.address);

            await relay();

            //SEND BACK TO SRC
            await nftLinkerAvalanche.sendNFT(nftLinkerAvalanche.address, tokenIdAvalanche, polygon.name, polygonUserWallet.address, {
                value: (1e18).toString(),
            });

            await relay();

            const balanaceSrcAfter = await deployedNftPolygon.balanceOf(polygonUserWallet.address);
            expect(balanaceSrcAfter).to.equal(parseInt(balanaceSrcBefore) + 1);
        });
    });

    describe('dest chain', async () => {
        beforeEach(async () => {
            tokenId += 1;
            const hash = utils.keccak256(utils.toUtf8Bytes(tokenId.toString()));

            nftLinkerPolygon = await deployUpgradable(
                polygon.constAddressDeployer.address,
                polygonUserWallet,
                NftLinker,
                NftLinkerProxy,
                [polygon.gateway.address, polygon.gasService.address],
                [],
                utils.defaultAbiCoder.encode(['string'], [polygon.name]),
                key,
            );

            tokenURI = `https://ipfs.io/ipfs/${hash}`;

            await deployedNftPolygon.mintWithMetadata(tokenId, hash, tokenURI);
            await deployedNftPolygon.approve(nftLinkerPolygon.address, tokenId);

            nftLinkerAvalanche = await deployUpgradable(
                avalanche.constAddressDeployer.address,
                avalancheUserWallet,
                NftLinker,
                NftLinkerProxy,
                [avalanche.gateway.address, avalanche.gasService.address],
                [],
                utils.defaultAbiCoder.encode(['string'], [avalanche.name]),
                key,
            );
        });
        afterEach(async () => {
            key = new Date().getMilliseconds().toString();
            await relay();
        });
        it('should set correct gateway addresses and gas service addresses on dest chain', async () => {
            expect(await nftLinkerAvalanche.gateway()).to.equal(avalanche.gateway.address);
            expect(await nftLinkerAvalanche.gasService()).to.equal(avalanche.gasService.address);
        });

        it('should mint nft to new owner', async () => {
            const balanaceAvalancheBefore = await nftLinkerAvalanche.balanceOf(avalancheUserWallet.address);
            await nftLinkerPolygon.sendNFT(deployedNftPolygon.address, tokenId, avalanche.name, avalancheUserWallet.address, {
                value: (1e18).toString(),
            });
            await relay();
            const balanaceAvalancheAfter = await nftLinkerAvalanche.balanceOf(avalancheUserWallet.address);
            expect(balanaceAvalancheAfter).to.equal(parseInt(balanaceAvalancheBefore) + 1);
        });
        it('should set tokenUri', async () => {
            const payload = utils.defaultAbiCoder.encode(
                ['string', 'address', 'uint256', 'string'],
                [polygon.name, deployedNftPolygon.address, tokenId, tokenURI],
            );
            const tokenIdAvalanche = utils.keccak256(payload);

            await expect(nftLinkerAvalanche.tokenURI(tokenIdAvalanche)).to.be.reverted;

            await nftLinkerPolygon.sendNFT(deployedNftPolygon.address, tokenId, avalanche.name, avalancheUserWallet.address, {
                value: (1e18).toString(),
            });

            await relay();

            const tokenUriAfter = await nftLinkerAvalanche.tokenURI(tokenIdAvalanche);

            expect(tokenUriAfter).to.equal(tokenURI);
        });
    });
});
