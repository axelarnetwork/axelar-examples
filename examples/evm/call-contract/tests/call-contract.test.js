const { utils } = require('ethers');
const { createNetwork, relay, deployContract } = require('@axelar-network/axelar-local-dev');
const CallContract = require('../../../../artifacts/examples/evm/call-contract/CallContract.sol/CallContract.json');

const { expect } = require('chai');

describe('Axelar Bonus Challenge', async () => {
    let polygon;
    let avalanche;

    let polygonUserWallet;
    let avalancheUserWallet;

    let deployedContractPolygon;
    let deployedContractAvalanche;

    before(async () => {
        // Initialize a Polygon network
        polygon = await createNetwork({
            name: 'Polygon',
        });

        // Initialize an Avalanche network
        avalanche = await createNetwork({
            name: 'avalanche',
        });

        // Extract user wallets for both networks
        [polygonUserWallet] = polygon.userWallets;
        [avalancheUserWallet] = avalanche.userWallets;

        deployedContractPolygon = await deployContract(polygonUserWallet, CallContract, [
            polygon.gateway.address,
            polygon.gasService.address,
        ]);
        deployedContractAvalanche = await deployContract(avalancheUserWallet, CallContract, [
            avalanche.gateway.address,
            avalanche.gasService.address,
        ]);
    });

    describe('src chain', async () => {
        it('should set correct gateway and gas service addresses on src chain', async () => {
            expect(await deployedContractPolygon.gateway()).to.equal(polygon.gateway.address);
            expect(await deployedContractPolygon.gasService()).to.equal(polygon.gasService.address);
        });
        // it('should fail if no gas sent', async () => {
        //     await expect(
        //         deployedContractPolygon.setRemoteValue('Avalanche', deployedContractAvalanche.address, 'Testing123'),
        //     ).to.be.revertedWith('Gas payment is required');
        // });
        it('should successfully trigger interchain tx', async () => {
            const payload = utils.defaultAbiCoder.encode(['string'], ['Testing123']);
            const hashedPayload = utils.keccak256(payload);
            await expect(
                deployedContractPolygon.setRemoteValue('Avalanche', deployedContractAvalanche.address, 'Testing123', {
                    value: (1e18).toString(),
                }),
            )
                .to.emit(polygon.gateway, 'ContractCall')
                .withArgs(deployedContractPolygon.address, 'Avalanche', deployedContractAvalanche.address, hashedPayload, payload);
        });

        it('should pay gas via axelar gas service', async () => {
            const payload = utils.defaultAbiCoder.encode(['string'], ['Testing123']);
            const hashedPayload = utils.keccak256(payload);
            await expect(
                deployedContractPolygon.setRemoteValue('Avalanche', deployedContractAvalanche.address, 'Testing123', {
                    value: (1e18).toString(),
                }),
            )
                .to.emit(polygon.gasService, 'NativeGasPaidForContractCall')
                .withArgs(
                    deployedContractPolygon.address,
                    'Avalanche',
                    deployedContractAvalanche.address,
                    hashedPayload,
                    (1e18).toString(),
                    polygonUserWallet.address,
                );
        });
    });

    describe('dest chain', async () => {
        it('should set correct gateway addresses and gas service addresses on dest chain', async () => {
            expect(await deployedContractAvalanche.gateway()).to.equal(avalanche.gateway.address);
            expect(await deployedContractAvalanche.gasService()).to.equal(avalanche.gasService.address);
        });

        it('should receive message on destination chain', async () => {});
        it('should register correct src address and src chain', async () => {});
        it('should emit Executed event', () => {});
    });
});
