'use strict';

require('dotenv').config();
const rootRequire = (path) => require(`../../${path}`);

const { Wallet } = require('ethers');
const { start, deploy, executeEVMExample, executeAptosExample } = rootRequire('scripts/libs');
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
    'send-ack',
    'send-token',
    // 'nft-linker',
    // 'nft-auctionhouse',
];

const aptosExamples = ['call-contract', 'token-linker'];

// These examples fork the mainnet, so they take a long time to run.
const forkExamples = [
    // 'cross-chain-lending', // cross-chain lending uses forecall which is deprecated, so ignore this example until migrating to GMP Express.
];

// disable logging
setLogger((...args) => {});

console.log = () => {};

const deployerKey = process.env.EVM_PRIVATE_KEY;
const deployerAddress = new Wallet(deployerKey).address;
const toFund = [deployerAddress];

describe('Check EVM Examples', function () {
    // marked as slow if it takes longer than 15 seconds to run each test.
    this.slow(15000);
    this.timeout(20000);

    beforeEach(async () => {
        // Remove local.json before each test to ensure a clean start
        if (fs.existsSync(infoPath)) {
            fs.unlinkSync(infoPath);
        }

        await start(toFund, ['Avalanche', 'Fantom']);
    });

    afterEach(async () => {
        await destroyExported();
    });

    const allExamples = [...examples, ...forkExamples];

    for (const exampleName of allExamples) {
        it(exampleName, async function () {
            const example = rootRequire(`examples/evm/${exampleName}/index.js`);
            const chains = fs.readJsonSync(infoPath);

            const wallet = new Wallet(deployerKey);

            if (example.deploy) await deploy('local', chains, wallet, example);

            await executeEVMExample('local', chains, [], wallet, example);
        });
    }
});

describe('Check Aptos Examples', function () {
    // marked as slow if it takes longer than 15 seconds to run each test.
    this.slow(15000);
    this.timeout(20000);

    beforeEach(async () => {
        // Remove local.json before each test to ensure a clean start
        if (fs.existsSync(infoPath)) {
            fs.unlinkSync(infoPath);
        }

        await start(toFund, ['Avalanche']);
    });

    afterEach(async () => {
        await destroyExported();
    });

    for (const exampleName of aptosExamples) {
        it(exampleName, async function () {
            const example = rootRequire(`examples/aptos/${exampleName}/index.js`);
            console.log(example);
            const chains = fs.readJsonSync(infoPath);

            const wallet = new Wallet(deployerKey);

            if (example.deploy) await deploy('local', chains, wallet, example);

            await executeAptosExample(chains, [], wallet, example);
        });
    }
});
