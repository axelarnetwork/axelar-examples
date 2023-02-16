const { start } = require('./libs/start');
const { getWallet } = require('./libs/utils');

const wallet = getWallet();
const fundAddresses = [wallet.address];

for (let j = 2; j < process.argv.length; j++) {
    fundAddresses.push(process.argv[j]);
}

// Insert the chains you want to start here. Available values are:
// 'Avalanche', 'Moonbeam', 'Polygon', 'Fantom', 'Ethereum'
const chains = [];

start(fundAddresses, chains);
