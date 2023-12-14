'use strict';

require('dotenv').config();

const { start, deploy, executeEVMExample, getWallet, getEVMChains, relayers } = require('../../scripts/libs');
const {
    destroyExported,
    utils: { setLogger },
} = require('@axelar-network/axelar-local-dev');
const fs = require('fs-extra');
const { configPath } = require('../../config');

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
];

describe('Verify EVM Examples', function () {
    const wallet = getWallet();
    const testChains = ['Avalanche', 'Fantom', 'Polygon'];

    const allExamples = [...examples];

    beforeEach(async () => {
        if (fs.existsSync(configPath.localEvmChains)) {
            fs.unlinkSync(configPath.localEvmChains);
        }

        await start([wallet.address], testChains, { relayInterval: 500, skipCosmos: true, skipAptos: true });
    });

    afterEach(async () => {
        await destroyExported(relayers);
    });

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
