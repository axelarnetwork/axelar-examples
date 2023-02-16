'use strict';
require('dotenv').config();
const { getExamplePath, checkEnv } = require('./libs/utils');
const { execute } = require('./libs/execute');

const exampleName = process.argv[2];
const env = process.argv[3];
const args = process.argv.slice(4);

// Check the environment. If it is not valid, exit.
checkEnv(env);

// Get the example object.
const example = require(getExamplePath(exampleName));

// Get the wallet.
const wallet = getWallet();

// Get the chains for the environment.
const chains = getChains(env);

// This will execute an example script. The example script must have an `execute` function.
execute(env, chains, args, wallet, example);
