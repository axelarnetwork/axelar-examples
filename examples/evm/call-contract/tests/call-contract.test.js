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
            name: 'Avalanche',
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

        it('should receive message on destination chain', async () => {
            const messageBefore = await deployedContractAvalanche.message();
            expect(messageBefore).to.equal('');

            await deployedContractPolygon.setRemoteValue('Avalanche', deployedContractAvalanche.address, 'Testing123', {
                value: (1e18).toString(),
            });

            await relay();

            const messageAfter = await deployedContractAvalanche.message();
            expect(messageAfter).to.equal('Testing123');
        });
        it('should register correct src address and src chain', async () => {
            /*
            TODO bugfix: relay() carries state from previous test

            const sourceAddressBefore = await deployedContractAvalanche.sourceAddress();
            expect(sourceAddressBefore).to.equal('');

            const sourceChainBefore = await deployedContractAvalanche.sourceChain();
            expect(sourceChainBefore).to.equal('');

            await deployedContractPolygon.setRemoteValue('Avalanche', deployedContractAvalanche.address, 'Testing123', {
                value: (1e18).toString(),
            });

            await relay();
            */

            const sourceAddressAfter = await deployedContractAvalanche.sourceAddress();
            expect(sourceAddressAfter).to.equal(deployedContractPolygon.address);

            const sourceChainAfter = await deployedContractAvalanche.sourceChain();
            expect(sourceChainAfter).to.equal('Polygon');
        });
        it('should emit Executed event', async () => {
            const ExecutedEvent = deployedContractAvalanche.filters.Executed();

            const blockNumberBefore = await avalanche.lastRelayedBlock;
            const blockInfoBefore = await avalanche.provider.getLogs(blockNumberBefore);
            const eventsBefore = await deployedContractAvalanche.queryFilter(ExecutedEvent, blockInfoBefore.hash);

            await deployedContractPolygon.setRemoteValue('Avalanche', deployedContractAvalanche.address, 'Testing123', {
                value: (1e18).toString(),
            });

            await relay();

            const blockNumberAfter = await avalanche.lastRelayedBlock;
            const blockInfoAfter = await avalanche.provider.getLogs(blockNumberAfter);

            const eventsAfter = await deployedContractAvalanche.queryFilter(ExecutedEvent, blockInfoAfter.hash);

            expect(eventsBefore.length + 1).to.equal(eventsAfter.length);

            for (const events in eventsAfter) {
                const event = eventsAfter[events];
                if (event.event == 'Executed') {
                    expect(event.args._from).to.equal(deployedContractPolygon.address);
                    expect(event.args._message).to.equal('Testing123');
                }
            }
        });
    });
});
