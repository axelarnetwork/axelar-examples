'use strict';

require('dotenv').config();

const { start, deploy, executeMultiversXExample, getWallet, getEVMChains, relayers } = require('../../scripts/libs');
const {
    destroyExported,
    utils: { setLogger },
} = require('@axelar-network/axelar-local-dev');
const fs = require('fs-extra');
const { configPath } = require('../../config');

// disable logging
setLogger((...args) => {});

console.log = () => {};

const multiversxExamples = ['call-contract'];

describe('Verify Multiversx Examples', function () {
    // marked as slow if it takes longer than 15 seconds to run each test.
    const wallet = getWallet();
    const testChains = ['Avalanche', 'Fantom', 'Polygon'];

    before(async () => {
        // Remove local-evm.json before each test to ensure a clean start
        if (fs.existsSync(configPath.localEvmChains)) {
            fs.unlinkSync(configPath.localEvmChains);
        }

        await start([wallet.address], testChains, { relayInterval: 500, skipCosmos: true });
    });

    after(async () => {
        await destroyExported(relayers);
    });

    for (const exampleName of multiversxExamples) {
        it(exampleName, async function () {
            const example = rootRequire(`examples/multiversx/${exampleName}/index.js`);
            const chains = getEVMChains('local', testChains);

            if (example.deploy) await deploy('local', chains, wallet, example);

            await executeMultiversXExample(chains, [], wallet, example);
        });
    }
});
