'use strict';

require('dotenv').config();
const { Wallet } = require('ethers');
const { createLocal } = require('../scripts/createLocal.js');
const { test } = require('../scripts/test.js');
const { deploy } = require('../scripts/deploy.js');
const {
    stopAll,
    utils: { setLogger },
} = require('@axelar-network/axelar-local-dev');
const fs = require('fs-extra');

const examples = [
    'call-contract',
    'call-contract-with-token',
    'cross-chain-token',
    'deposit-address',
    'forecall',
    'headers',
    'nft-auctionhouse',
    'nft-linker',
    'nonced-execution',
    'send-ack',
    'send-token',
];

describe('Examples', function () {
    this.timeout(10000);
    // disable logging
    setLogger((...args) => {});

    console.log = () => {};

    const deployerKey = process.env.EVM_PRIVATE_KEY;
    const deployerAddress = new Wallet(deployerKey).address;
    const toFund = [deployerAddress];

    beforeEach(async () => {
        await createLocal(toFund);
    });

    afterEach(async () => {
        await stopAll();
    });

    for (const exampleName of examples) {
        it(exampleName, async () => {
            const example = require(`../examples/${exampleName}/index.js`);
            const chains = fs.readJsonSync('./info/local.json');

            const wallet = new Wallet(deployerKey);

            if (example.deploy) await deploy('local', chains, wallet, example);

            await test('local', chains, [], wallet, example);
        });
    }
});
