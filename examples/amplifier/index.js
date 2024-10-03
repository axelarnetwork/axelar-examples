const { program } = require('commander');
const { sleep, gmp, deploy } = require('./utils');

const { getConfig } = require('./config/config.js');
const { pollTasks } = require('./gmp-api/tasks');
require('dotenv').config();

const config = getConfig().chains;

program.option('-s, --sourceChain <sourceChain>', 'source chain', 'avalanche-fuji');
program.option('-d, --destinationChain <destinationChain>', 'destination chain', 'xrpl-evm-sidechain');
program.option('-m, --message <message>', 'message string to send', 'hello');

program.parse();

const options = program.opts();

const main = async () => {
    const { sourceChain, destinationChain, message } = options;

    const srcContractDeployment = await deploy(sourceChain);
    const destContract = await deploy(destinationChain);

    console.log('Contracts deployed, waiting 10 seconds for txs to propagate');
    await sleep(10000);

    await gmp(
        {
            destinationChain,
            sourceChain,
            message,
            destinationContractAddress: destContract.address,
            srcContractAddress: srcContractDeployment.address,
        },
        config,
    );
};

main(null).then(() => pollTasks({ chainName: options.destinationChain, pollInterval: 10000, dryRunOpt: false }));
