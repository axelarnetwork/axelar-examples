'use strict';
require("dotenv").config();

const { utils: { setJSON }, testnetInfo } = require('@axelar-network/axelar-local-dev');
const {  Wallet, getDefaultProvider, constants: { AddressZero } } = require('ethers');
const { keccak256, defaultAbiCoder } = require('ethers/lib/utils');
const { GasCostLogger } = require('./gasCosts');
const { getGasPrice, getDepositAddress } = require('./utils.js');



async function test(env, chains, args, wallet, example) {
    function wrappedGetGasPrice(source, destination, tokenAddress) {
        return getGasPrice(env, source, destination, tokenAddress);
    }
    function wrappedGetDepositAddress(source, destination, destinationAddress, symbol) {
        return getDepositAddress(env, source, destination, destinationAddress, symbol);
    }
        
    await example.test(chains, wallet, {
        getGasPrice: wrappedGetGasPrice, 
        getDepositAddress: wrappedGetDepositAddress,
        args: args
    });
}

module.exports = {
    test,
}

if (require.main === module) {
    const private_key = process.env.EVM_PRIVATE_KEY;
    const wallet = new Wallet(private_key);

    const example = require(`../${process.argv[2]}/index.js`);
    const env = process.argv[3];
    if(env == null || (env != 'testnet' && env != 'local')) throw new Error('Need to specify tesntet or local as an argument to this script.');
    let temp;
    if(env == 'local') {
        temp = require(`../info/local.json`);
    } else {
        try {
            temp = require(`../info/testnet.json`);
        } catch {
            temp = testnetInfo;
        }
    }
    const chains = temp;
    const args = process.argv.slice(4);

    test(env, chains, args, wallet, example);
}
