const { utils } = require('ethers');
const { createNetwork, relay, deployContract } = require('@axelar-network/axelar-local-dev');
const CallContractWithToken = require('../../../../artifacts/examples/evm/call-contract-with-token/CallContractWithToken.sol/CallContractWithToken.json');

const { expect } = require('chai');

describe('Call Contract With Token', async () => {
    let polygon;
    let avalanche;

    let polygonUserWallet;
    let avalancheUserWallet;
    let avalancheUserWalletTwo;

    let deployedContractPolygon;
    let deployedContractAvalanche;

    let aUSDCPolygon;
    let aUSDCAvalanche;

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

        // Deploy USDC token on the Polygon network
        await polygon.deployToken('USDC', 'aUSDC', 6, BigInt(100_000e6));

        // Deploy USDC token on the Fantom network
        await avalanche.deployToken('USDC', 'aUSDC', 6, BigInt(100_000e6));

        // Get token contracts for both chains
        aUSDCPolygon = await polygon.getTokenContract('aUSDC');
        aUSDCAvalanche = await avalanche.getTokenContract('aUSDC');

        await polygon.giveToken(polygonUserWallet.address, 'aUSDC', BigInt(100e6));
    });

    describe('src chain', async () => {
        beforeEach(async () => {
            deployedContractPolygon = await deployContract(polygonUserWallet, CallContractWithToken, [
                polygon.gateway.address,
                polygon.gasService.address,
            ]);
            deployedContractAvalanche = await deployContract(avalancheUserWallet, CallContractWithToken, [
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
        /*
        it('should fail if no gas sent', async () => {
            await expect(
                deployedContractPolygon.setRemoteValue('Avalanche', deployedContractAvalanche.address, 'Testing123'),
            ).to.be.revertedWith('Gas payment is required');
        });
        */
        it('should deduct funds from msg.sender', async () => {
            const totalSupplyBefore = await aUSDCPolygon.totalSupply();
            const myBalanceBefore = await aUSDCPolygon.balanceOf(polygonUserWallet.address);

            await deployedContractPolygon.sendToMany(
                avalanche.name,
                deployedContractAvalanche.address,
                [avalancheUserWallet.address, avalancheUserWalletTwo.address],
                'aUSDC',
                6e6,
                {
                    value: (1e18).toString(),
                },
            );

            const myBalanceAfter = await aUSDCPolygon.balanceOf(polygonUserWallet.address);
            const totalSupplyAfter = await aUSDCPolygon.totalSupply();

            expect(myBalanceAfter).to.equal(myBalanceBefore - 6e6);
            expect(totalSupplyAfter).to.equal(totalSupplyBefore - 6e6); //token was burnt on src
        });
        it('should successfully trigger interchain tx', async () => {
            const payload = utils.defaultAbiCoder.encode(['address[]'], [[avalancheUserWallet.address, avalancheUserWalletTwo.address]]);
            const hashedPayload = utils.keccak256(payload);
            await expect(
                deployedContractPolygon.sendToMany(
                    avalanche.name,
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
                    avalanche.name,
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
                    avalanche.name,
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
                    avalanche.name,
                    deployedContractAvalanche.address,
                    hashedPayload,
                    'aUSDC',
                    6e6,
                    (1e18).toString(),
                    polygonUserWallet.address,
                );
        });
    });

    describe('dest chain', async () => {
        beforeEach(async () => {
            deployedContractPolygon = await deployContract(polygonUserWallet, CallContractWithToken, [
                polygon.gateway.address,
                polygon.gasService.address,
            ]);
            deployedContractAvalanche = await deployContract(avalancheUserWallet, CallContractWithToken, [
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

        it('should distribute token evenly', async () => {
            const receiverOneBalanceBefore = await aUSDCAvalanche.balanceOf(avalancheUserWalletTwo.address);
            const receiverTwoBalanceBefore = await aUSDCAvalanche.balanceOf(avalancheUserWalletTwo.address);

            await deployedContractPolygon.sendToMany(
                avalanche.name,
                deployedContractAvalanche.address,
                [avalancheUserWallet.address, avalancheUserWalletTwo.address],
                'aUSDC',
                6e6,
                {
                    value: (1e18).toString(),
                },
            );

            await relay();

            const receiverOneBalanceAfter = await aUSDCAvalanche.balanceOf(avalancheUserWallet.address);
            expect(receiverOneBalanceAfter).to.equal(parseInt(receiverOneBalanceBefore) + 3e6);

            const receiverTwoBalanceAfter = await aUSDCAvalanche.balanceOf(avalancheUserWalletTwo.address);
            expect(receiverTwoBalanceAfter).to.equal(parseInt(receiverTwoBalanceBefore) + 3e6);
        });
        it('should emit Executed event', async () => {
            const ExecutedEvent = deployedContractAvalanche.filters.Executed();

            const blockNumberBefore = await avalanche.lastRelayedBlock;
            const blockInfoBefore = await avalanche.provider.getLogs(blockNumberBefore);
            const eventsBefore = await deployedContractAvalanche.queryFilter(ExecutedEvent, blockInfoBefore.hash);

            await deployedContractPolygon.sendToMany(
                avalanche.name,
                deployedContractAvalanche.address,
                [avalancheUserWallet.address, avalancheUserWalletTwo.address],
                'aUSDC',
                6e6,
                {
                    value: (1e18).toString(),
                },
            );

            await relay();

            const blockNumberAfter = await avalanche.lastRelayedBlock;
            const blockInfoAfter = await avalanche.provider.getLogs(blockNumberAfter);

            const eventsAfter = await deployedContractAvalanche.queryFilter(ExecutedEvent, blockInfoAfter.hash);

            expect(eventsBefore.length + 1).to.equal(eventsAfter.length);

            for (const events in eventsAfter) {
                const event = eventsAfter[events];
                expect(event.event).to.equal('Executed');
            }
        });
    });
});
