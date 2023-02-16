const { start, getWallet } = require('./libs');

// Get the wallet from the environment variables.
const wallet = getWallet();

// Fund the given addresses with aUSDC.
const fundAddresses = [wallet.address];

// Add additional addresses to fund here.
for (let j = 2; j < process.argv.length; j++) {
    fundAddresses.push(process.argv[j]);
}

// Insert the chains you want to start here. Available values are:
// 'Avalanche', 'Moonbeam', 'Polygon', 'Fantom', 'Ethereum'
const chains = [];

// Start the chains.
start(fundAddresses, chains);
