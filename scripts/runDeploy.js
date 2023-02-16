import { deploy } from './libs/deploy.js';
import { checkEnv, getChains, getExamplePath } from './libs/utils.js';

const exampleName = process.argv[2];
const env = process.argv[3];

// Check the environment. If it is not valid, exit.
checkEnv(env);

// Get the example object.
const example = require(getExamplePath(exampleName));

// Get the chains for the environment.
const chains = getChains(env);

// Get the wallet.
const wallet = getWallet();

// This will execute an example script. The example script must have a `deploy` function.
deploy(env, chains, wallet, example);
