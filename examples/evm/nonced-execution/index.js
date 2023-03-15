'use strict';

const {
    utils: { defaultAbiCoder },
} = require('ethers');
const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');

const Executable = rootRequire('./artifacts/examples/evm/nonced-execution/ExecutableImplementation.sol/ExecutableImplementation.json');

const time = new Date().getTime();

async function deploy(chain, wallet) {
    chain.wallet = wallet;
    console.log(`Deploying ExecutableImplementation for ${chain.name}.`);
    chain.contract = await deployContract(wallet, Executable, [chain.gateway, chain.gasService]);
    console.log(`Deployed ExecutableImplementation for ${chain.name} at ${chain.contract.address}.`);
}

async function execute(chains, wallet, options) {
    const args = options.args || [];
    const calculateBridgeFee = options.calculateBridgeFee;

    const source = chains.find((chain) => chain.name === (args[0] || 'Avalanche'));
    const destination = chains.find((chain) => chain.name === (args[1] || 'Fantom'));
    const message = args[2] || `Hello, the time is ${time}.`;
    const payload = defaultAbiCoder.encode(['string'], [message]);
    const expectedNonce = await destination.contract.incomingNonces(source.name, source.contract.address);

    async function print() {
        console.log(
            `${source.name} -> ${destination.name} message: ${await destination.contract.messages(
                source.name,
                source.contract.address,
                expectedNonce,
            )}`,
        );
    }

    function sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, ms);
        });
    }

    console.log('--- Initially ---');
    await print();

    const fee = await calculateBridgeFee(source, destination);

    await (await source.contract.sendContractCall(destination.name, destination.contract.address, payload, { value: fee })).wait();

    console.log('--- Waiting for message to be received ---');

    let destMessage = '';

    while (destMessage !== message) {
        destMessage = await destination.contract.messages(source.name, source.contract.address, expectedNonce);
        await sleep(2000);
    }

    console.log('--- After ---');
    await print();
}

module.exports = {
    deploy,
    execute,
};
