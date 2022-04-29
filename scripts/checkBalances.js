'use strict';

const { testnetInfo } = require('@axelar-network/axelar-local-dev');
const { ethers } = require('ethers');

const chains =  testnetInfo;
const address = process.argv[2] || '0xBa86A5719722B02a5D5e388999C25f3333c7A9fb';
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