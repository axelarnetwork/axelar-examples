const { utils } = require('ethers');
const { createNetwork, relay, deployContract } = require('@axelar-network/axelar-local-dev');
const NftLinker = require('../../../../artifacts/examples/evm/nft-linker/NftLinker.sol/NftLinker.json');

const { expect } = require('chai');

describe('NFT Linker', async () => {
    let polygon;
    let avalanche;

    let polygonUserWallet;
    let avalancheUserWallet;
    let avalancheUserWalletTwo;

    let deployedContractPolygon;
    let deployedContractAvalanche;

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
        [avalancheUserWallet, avalancheUserWalletTwo] = avalanche.userWallets;
    });

    describe('src chain', async () => {
        beforeEach(async () => {
            deployedContractPolygon = await deployContract(polygonUserWallet, NftLinker, [
                polygon.gateway.address,
                polygon.gasService.address,
            ]);
            deployedContractAvalanche = await deployContract(avalancheUserWallet, NftLinker, [
                avalanche.gateway.address,
                avalanche.gasService.address,
            ]);
            await aUSDCPolygon.connect(polygonUserWallet).approve(deployedContractPolygon.address, (100e18).toString());
        });
        afterEach(async () => {
            await relay();
        });
        it('should set correct gateway and gas service addresses on src chain', async () => {
            expect(await deployedContractPolygon.gateway()).to.equal(polygon.gateway.address);
            expect(await deployedContractPolygon.gasService()).to.equal(polygon.gasService.address);
        });
        it('should set correct chain name', async () => {});
        it('should lock nft', async () => {});
        it('should successfully trigger interchain tx', async () => {
            const payload = utils.defaultAbiCoder.encode(['address[]'], [[avalancheUserWallet.address, avalancheUserWalletTwo.address]]);
            const hashedPayload = utils.keccak256(payload);
            await expect(
                deployedContractPolygon.sendToMany(
                    'Avalanche',
                    deployedContractAvalanche.address,
                    [avalancheUserWallet.address, avalancheUserWalletTwo.address],
                    'aUSDC',
                    6e6,
                    {
                        value: (1e18).toString(),
                    },
                ),
            )
                .to.emit(polygon.gateway, 'ContractCallWithToken')
                .withArgs(
                    deployedContractPolygon.address,
                    'Avalanche',
                    deployedContractAvalanche.address,
                    hashedPayload,
                    payload,
                    'aUSDC',
                    6e6,
                );
        });
        it('should pay gas via axelar gas service', async () => {
            const payload = utils.defaultAbiCoder.encode(['address[]'], [[avalancheUserWallet.address, avalancheUserWalletTwo.address]]);
            const hashedPayload = utils.keccak256(payload);
            await expect(
                deployedContractPolygon.sendToMany(
                    'Avalanche',
                    deployedContractAvalanche.address,
                    [avalancheUserWallet.address, avalancheUserWalletTwo.address],
                    'aUSDC',
                    6e6,
                    {
                        value: (1e18).toString(),
                    },
                ),
            )
                .to.emit(polygon.gasService, 'NativeGasPaidForContractCallWithToken')
                .withArgs(
                    deployedContractPolygon.address,
                    'Avalanche',
                    deployedContractAvalanche.address,
                    hashedPayload,
                    'aUSDC',
                    6e6,
                    (1e18).toString(),
                    polygonUserWallet.address,
                );
        });
        it('should return nft to original sender', async () => {});
    });

    describe('dest chain', async () => {
        beforeEach(async () => {
            deployedContractPolygon = await deployContract(polygonUserWallet, NftLinker, [
                polygon.gateway.address,
                polygon.gasService.address,
            ]);
            deployedContractAvalanche = await deployContract(avalancheUserWallet, NftLinker, [
                avalanche.gateway.address,
                avalanche.gasService.address,
            ]);

            await aUSDCPolygon.connect(polygonUserWallet).approve(deployedContractPolygon.address, (100e18).toString());
        });
        afterEach(async () => {
            await relay();
        });
        it('should set correct gateway addresses and gas service addresses on dest chain', async () => {
            expect(await deployedContractAvalanche.gateway()).to.equal(avalanche.gateway.address);
            expect(await deployedContractAvalanche.gasService()).to.equal(avalanche.gasService.address);
        });

        it('should mint nft to new owner', async () => {});
        it('should set tokenUri', async () => {});
        it('should set new tokenId', async () => {});
        it('should revert if source address is another nft linker', async () => {});
    });
});
