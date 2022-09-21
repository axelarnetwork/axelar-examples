'use strict';

require("dotenv").config();
const {
    utils: { defaultAbiCoder, keccak256 },
    Wallet,
} = require('ethers');
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

describe('examples', () => {
    setLogger((...args) => {});
    const deployer_key = process.env.EVM_PRIVATE_KEY;
    const deployer_address = new Wallet(deployer_key).address;
    const toFund = [deployer_address];

    beforeEach(async () => {
        await createLocal(toFund);
    });

    afterEach(async () => {
        await stopAll();
    });

    for (const exampleName of examples) {
        const example = require(`../examples/${exampleName}/index.js`);
        it(exampleName, async () => {
            const chains = fs.readJsonSync('./info/local.json');

            const wallet = new Wallet(deployer_key);
            if (example.deploy) await deploy('local', chains, wallet, example);

            await test('local', chains, [], wallet, example);
        });
    }
});
