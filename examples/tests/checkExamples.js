'use strict';

require('dotenv').config();

const {
    start,
    deploy,
    executeEVMExample,
    executeAptosExample,
    getWallet,
    getEVMChains,
    relayers,
    executeCosmosExample,
} = require('../../scripts/libs');
const {
    destroyExported,
    utils: { setLogger },
} = require('@axelar-network/axelar-local-dev');
const fs = require('fs-extra');
const { configPath } = require('../../config');
const { config } = require('dotenv');

// disable logging
setLogger((...args) => {});

console.log = () => {};

const examples = [
    'call-contract',
    'call-contract-with-token',
    'call-contract-with-token-express',
    'cross-chain-token',
    'deposit-address',
    'nonced-execution',
    'send-ack',
    'send-token',
    // 'nft-linker',
    // 'nft-auctionhouse',
];

const aptosExamples = ['call-contract', 'token-linker'];

const cosmosExamples = ['call-contract'];

describe('Check Examples Execution', function () {
    // marked as slow if it takes longer than 15 seconds to run each test.
    const wallet = getWallet();
    const testChains = ['Avalanche', 'Fantom', 'Polygon'];

    beforeEach(async () => {
        // Remove local-evm8.json before each test to ensure a clean start
        if (fs.existsSync(configPath.localEvmChains)) {
            fs.unlinkSync(configPath.localEvmChains);
        }

        await start([wallet.address], testChains, { relayInterval: 500 });
    });

    afterEach(async () => {
        await destroyExported(relayers);
    });

    describe('EVM Examples', function () {
        const allExamples = [...examples];

        for (const exampleName of allExamples) {
            it(exampleName, async function () {
                const example = rootRequire(`examples/evm/${exampleName}/index.js`);
                const chains = getEVMChains('local', testChains);

                if (example.deploy) {
                    await deploy('local', chains, wallet, example);
                }

                await executeEVMExample('local', chains, [], wallet, example);
            });
        }
    });

    describe('Aptos Examples', function () {
        for (const exampleName of aptosExamples) {
            it(exampleName, async function () {
                const example = rootRequire(`examples/aptos/${exampleName}/index.js`);
                const chains = getEVMChains('local', testChains);

                if (example.deploy) await deploy('local', chains, wallet, example);

                await executeAptosExample(chains, [], wallet, example);
            });
        }
    });

    describe('Cosmos Examples', function () {
        for (const exampleName of cosmosExamples) {
            it(exampleName, async function () {
                const example = rootRequire(`examples/cosmos/${exampleName}/index.js`);
                const chains = getEVMChains('local', testChains);

                if (example.deploy) await deploy('local', chains, wallet, example);

                await executeCosmosExample('local', chains, [], wallet, example);
            });
        }
    });
});
