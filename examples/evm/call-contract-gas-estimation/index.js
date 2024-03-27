'use strict';

const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');

const CallContractGasEstimation = rootRequire(
    './artifacts/examples/evm/call-contract-gas-estimation/CallContractGasEstimation.sol/CallContractGasEstimation.json',
);

async function deploy(chain, wallet) {
    console.log(`Deploying CallContractGasEstimation for ${chain.name}.`);
    chain.contract = await deployContract(wallet, CallContractGasEstimation, [chain.gateway, chain.gasService]);
    chain.wallet = wallet;
    console.log(`Deployed CallContractGasEstimation for ${chain.name} at ${chain.contract.address}.`);
}

async function execute(chains, wallet, options) {
    const args = options.args || [];
    const { source, destination, calculateBridgeFee } = options;
    const message = args[2] || `Hello ${destination.name} from ${source.name}, it is ${new Date().toLocaleTimeString()}.`;

    async function logValue() {
        console.log(`value at ${destination.name} is "${await destination.contract.message()}"`);
    }

    console.log('--- Initially ---');
    await logValue();

    const fee = await calculateBridgeFee(source, destination);

    const tx = await source.contract.setRemoteValue(destination.name, destination.contract.address, message, {
        value: Math.ceil(fee),
    });
    await tx.wait();

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    while ((await destination.contract.message()) !== message) {
        await sleep(1000);
    }

    console.log('--- After ---');
    await logValue();
}

module.exports = {
    deploy,
    execute,
};
