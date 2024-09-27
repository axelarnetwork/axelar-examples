const { sleep } = require('./utils/sleep');
const { getConfig } = require('./config');
const { gmp } = require('./utils/gmp');
const { processContractCallEvent } = require('./gmp-api/contract-call-event');
const { pollTasks } = require('./gmp-api/tasks');
require('dotenv').config();

const config = getConfig().chains;

const params = {
    srcGatewayAddress: config['avalanche-fuji'].externalGateway,
    srcChain: config['avalanche-fuji'].id,
    destinationChain: 'xrpl-evm-sidechain',
    message: 'hi',
    destinationContractAddress: null,
};

const main = async () => {
    const { transactionReceipt } = await gmp(params, config);

    await sleep(2000);

    processContractCallEvent(params.srcChain, transactionReceipt.transactionHash, true);
};

pollTasks({ chainName: 'xrpl-evm-sidechain', pollInterval: 10000, dryRunOpt: true });
main(null);
