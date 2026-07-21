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
    // Excluded on local: demonstrates the on-chain gas service estimateGasFee()/payGas()
    // API, which mainnet's gas service (cgp ~6.4.0) has but local-dev's (cgp 6.2.1, pinned
    // for ITS 1.2.4) does not. Re-enable with the cgp-6.4 / gmp-sdk-6 / ITS-2.1.1 stack bump.
    // See axelar-local-dev docs/its-mainnet-parity.md.
    // 'call-contract-gas-estimation',
    'call-contract-with-token',
    'call-contract-with-token-express',
    'cross-chain-token',
    // 'multichain-nft-mint',
    'nonced-execution',
    'nft-linker',
    'send-ack',
];

describe('Verify EVM Examples', function () {
    const wallet = getWallet();
    const testChains = ['Avalanche', 'Fantom', 'Polygon'];

    const allExamples = [...examples];

    beforeEach(async () => {
        if (fs.existsSync(configPath.localEvmChains)) {
            fs.unlinkSync(configPath.localEvmChains);
        }

        await start([wallet.address], testChains, { relayInterval: 500, skipCosmos: true });
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
