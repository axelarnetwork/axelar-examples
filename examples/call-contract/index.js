'use strict';

const {
    getDefaultProvider,
    Contract,
    constants: { AddressZero },
} = require('ethers');
const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');

const { sleep } = require('../../utils');
const ExecutableSample = require('../../artifacts/examples/call-contract/ExecutableSample.sol/ExecutableSample.json');

async function deploy(chain, wallet) {
    console.log(`Deploying ExecutableSample for ${chain.name}.`);
    const provider = getDefaultProvider(chain.rpc);
    chain.wallet = wallet.connect(provider);
    chain.contract = await deployContract(wallet, ExecutableSample, [chain.gateway, chain.gasReceiver]);
    console.log(`Deployed ExecutableSample for ${chain.name} at ${chain.contract.address}.`);
}

async function test(chains, wallet, options) {
    const args = options.args || [];
    const getGasPrice = options.getGasPrice;

    const source = chains.find((chain) => chain.name === (args[0] || 'Avalanche'));
    const destination = chains.find((chain) => chain.name === (args[1] || 'Fantom'));
    const message = args[2] || `Hello ${destination.name} from ${source.name}, it is ${new Date().toLocaleTimeString()}.`;

    async function logValue() {
        console.log(`value at ${destination.name} is "${await destination.contract.value()}"`);
    }

    console.log('--- Initially ---');
    await logValue();

    // Set the gasLimit to 3e5 (a safe overestimate) and get the gas price.
    const gasLimit = 3e5;
    const gasPrice = await getGasPrice(source, destination, AddressZero);

    const tx = await source.contract.setRemoteValue(destination.name, destination.contract.address, message, {
        value: BigInt(Math.floor(gasLimit * gasPrice)),
    });
    await tx.wait();

    while ((await destination.contract.value()) !== message) {
        await sleep(1000);
    }

    console.log('--- After ---');
    await logValue();
}

module.exports = {
    deploy,
    test,
};
