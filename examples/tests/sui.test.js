'use strict';

require('dotenv').config();

const { expect } = require('chai');
const fs = require('fs-extra');
const { start, deploy, getWallet, getEVMChains, relayers, executeSuiExample } = require('../../scripts/libs');
const {
    destroyExported,
    utils: { setLogger },
} = require('@axelar-network/axelar-local-dev');
const { configPath } = require('../../config');
const { enabledSui } = require('../../scripts/libs/config');

// disable logging
setLogger((...args) => {});

console.log = () => {};

const suiExamples = ['call-contract'];
const testChains = ['Avalanche'];

describe('Verify Sui Examples', function () {
    const wallet = getWallet();

    let dropConnections;

    beforeEach(async () => {
        // A fresh localnet publishes new package ids, so a stale side-file
        // would point at objects that no longer exist.
        for (const configFile of [configPath.localEvmChains, configPath.localSuiChains]) {
            if (fs.existsSync(configFile)) fs.unlinkSync(configFile);
        }

        dropConnections = await start([wallet.address], testChains, { relayInterval: 2000, skipCosmos: true });
    });

    afterEach(async () => {
        await destroyExported(relayers);
        await dropConnections();
    });

    if (!enabledSui) {
        console.info('Sui is not enabled in the config file. Skipping Sui tests.');
    } else {
        for (const exampleName of suiExamples) {
            it(exampleName, async function () {
                const example = rootRequire(`examples/sui/${exampleName}/index.js`);
                const chains = getEVMChains('local', testChains);

                await deploy('local', chains, wallet, example);
                await executeSuiExample(chains, [], wallet, example);

                // Bring-up assertions. Delivery itself is exercised by the
                // axelar-local-dev-sui package's own tests; asserting it here
                // would make this test depend on relay latency.
                const suiConfig = fs.readJsonSync(configPath.localSuiChains);

                expect(suiConfig.packageId).to.match(/^0x[0-9a-f]{64}$/);
                expect(suiConfig.singletonId).to.match(/^0x[0-9a-f]{64}$/);
                expect(suiConfig.channelAddress).to.match(/^0x[0-9a-f]{64}$/);
                expect(suiConfig.channelAddress).to.not.equal(suiConfig.packageId);
            });
        }
    }
});
