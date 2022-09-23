'use strict';
require("dotenv").config();
const { testnetInfo } = require('@axelar-network/axelar-local-dev');
const { ethers, Wallet } = require('ethers');

const chains =  testnetInfo;
const deployer_key = process.env.EVM_PRIVATE_KEY;
const address = new Wallet(deployer_key).address;
(async () => {
    const promises = []
    for(const chain of chains) {
        const rpc = chain.rpc;
        const provider = ethers.getDefaultProvider(rpc);
        promises.push(provider.getBalance(address));
    }
    await Promise.all(promises);
    for(const chain of chains) {
        const balance = (await promises.shift())/1e18;
        console.log(`Account ${address} has ${balance} ${chain.tokenSymbol} on ${chain.name}.`);
    }
})();