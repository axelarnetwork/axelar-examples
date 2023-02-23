'use strict';

const { ethers } = require('ethers');
const { getWallet, getBalances, getChains, checkEnv } = require('./libs');
const testnetChains = require('@axelar-network/axelar-cgp-solidity/info/testnet.json');

// Get the environment from the command line. If it is not provided, use 'testnet'.
const env = process.argv[2] || 'testnet';

// Check the environment. If it is not valid, exit.
checkEnv(env);

// Get the chains for the environment.
const allTestnetChains = testnetChains.map((chain) => chain.name);
const chains = getChains(env, allTestnetChains);

// Get the wallet.
const wallet = getWallet();

// Print the balances. This will print the balances of the wallet on each chain.
console.log(`==== Print balances for ${env} =====`);
console.log('Wallet address:', wallet.address, '\n');
getBalances(chains, wallet.address).then((balances) => {
    for (let i = 0; i < chains.length; i++) {
        console.log(`${chains[i].name}: ${ethers.utils.formatEther(balances[chains[i].name])} ${chains[i].tokenSymbol}`);
    }
});
