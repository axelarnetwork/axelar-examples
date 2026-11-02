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

                // execute() polls for delivery in both directions and throws if
                // either does not arrive, so reaching the next line means a
                // message crossed EVM -> Sui and Sui -> EVM. That matters: the
                // Sui -> EVM leg is asserted in no other CI, since the sibling
                // package covers it only in its excluded end-to-end suite.
                await executeSuiExample(chains, [], wallet, example);

                const suiConfig = fs.readJsonSync(configPath.localSuiChains);

                expect(suiConfig.packageId).to.match(/^0x[0-9a-f]{64}$/);
                expect(suiConfig.singletonId).to.match(/^0x[0-9a-f]{64}$/);
                expect(suiConfig.channelAddress).to.match(/^0x[0-9a-f]{64}$/);
            });
        }
    }
});
