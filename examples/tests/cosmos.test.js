'use strict';

require('dotenv').config();

const { start, deploy, getWallet, getEVMChains, relayers, executeCosmosExample } = require('../../scripts/libs');
const {
    destroyExported,
    utils: { setLogger },
} = require('@axelar-network/axelar-local-dev');
const fs = require('fs-extra');
const { configPath } = require('../../config');
const { stopAll } = require('@axelar-network/axelar-local-dev-cosmos');

// disable logging
setLogger((...args) => {});

console.log = () => {};

const cosmosExamples = ['call-contract'];

describe('Verify Cosmos Examples', function () {
    // marked as slow if it takes longer than 15 seconds to run each test.
    const wallet = getWallet();

    let dropConnections;
    beforeEach(async () => {
        // Remove local-evm.json before each test to ensure a clean start
        if (fs.existsSync(configPath.localEvmChains)) {
            fs.unlinkSync(configPath.localEvmChains);
        }

        dropConnections = await start([wallet.address], ['Ethereum'], { relayInterval: 2000, skipAptos: true });
    });

    afterEach(async () => {
        await destroyExported(relayers);
        await stopAll();
        await dropConnections();
    });

    for (const exampleName of cosmosExamples) {
        it(exampleName, async function () {
            const example = rootRequire(`examples/cosmos/${exampleName}/index.js`);
            const chains = getEVMChains('local', ['Ethereum']);

            if (example.deploy) await deploy('local', chains, wallet, example);

            await executeCosmosExample('local', chains, [], wallet, example);
        });
    }
});
