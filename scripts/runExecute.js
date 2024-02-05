'use strict';
require('dotenv').config();
const {
    executeEVMExample,
    executeCosmosExample,
    checkEnv,
    getExamplePath,
    getWallet,
    getEVMChains,
} = require('./libs');

const exampleName = process.argv[2];
const env = process.argv[3];
const args = process.argv.slice(4);

// Check the environment. If it is not valid, exit.
checkEnv(env);

// Get the example object.
const example = require(getExamplePath(exampleName));

// Get the wallet.
const wallet = getWallet();

// This will execute an example script. The example script must have an `execute` function.
if (exampleName.split('/')[0] === 'evm') {
    // Get the chains for the environment.
    let selectedChains = [];

    if (args.length >= 2) {
        selectedChains = [args[0], args[1]];
    }

    const chains = getEVMChains(env, selectedChains);

    executeEVMExample(env, chains, args, wallet, example);
} else if (exampleName.split('/')[0] === 'cosmos') {
    const chains = getEVMChains(env);
    executeCosmosExample(env, chains, args, wallet, example);
}
