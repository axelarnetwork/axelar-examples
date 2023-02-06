'use strict';

require('dotenv').config();
const rootRequire = (path) => require(`../../${path}`);
const { Wallet } = require('ethers');
const { start } = rootRequire('scripts/start.js');
const { execute } = rootRequire('scripts/execute.js');
const { deploy } = rootRequire('scripts/deploy.js');
const {
    destroyExported,
    utils: { setLogger },
} = require('@axelar-network/axelar-local-dev');
const fs = require('fs-extra');
const path = require('path');

const dir = path.resolve(__dirname, '..', '..');
const infoPath = path.join(dir, 'chain-config/local.json');

const examples = [
    'call-contract',
    'call-contract-with-token',
    'cross-chain-token',
    'deposit-address',
    // 'forecall',
    'nft-auctionhouse',
    'nft-linker',
    'send-ack',
    'send-token',
];

describe('Check Examples', function () {
    // marked as slow if it takes longer than 15 seconds to run each test.
    this.slow(15000);
    this.timeout(20000);

    // disable logging
    setLogger((...args) => {});

    console.log = () => {};

    const deployerKey = process.env.EVM_PRIVATE_KEY;
    const deployerAddress = new Wallet(deployerKey).address;
    const toFund = [deployerAddress];

    beforeEach(async () => {
        // // Remove local.json before each test to ensure a clean start
        if (fs.existsSync(infoPath)) {
            fs.unlinkSync(infoPath);
        }

        await start(toFund, ['Avalanche', 'Fantom']);
    });

    afterEach(async () => {
        await destroyExported();
    });

    for (const exampleName of examples) {
        it(exampleName, async function () {
            const example = rootRequire(`examples/evm/${exampleName}/index.js`);
            console.log(example);
            const chains = fs.readJsonSync(infoPath);

            const wallet = new Wallet(deployerKey);

            if (example.deploy) await deploy('local', chains, wallet, example);

            await execute('local', chains, [], wallet, example);
        });
    }
});
