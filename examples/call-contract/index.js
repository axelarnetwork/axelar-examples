'use strict';

const { getDefaultProvider, Contract, constants: { AddressZero } } = require('ethers');
const { utils: { deployContract }} = require('@axelar-network/axelar-local-dev');

const ExecutableSample = require('../../build/ExecutableSample.json');

async function deploy(chain, wallet) {
    console.log(`Deploying ExecutableSample for ${chain.name}.`);
    const contract = await deployContract(wallet, ExecutableSample, [chain.gateway, chain.gasReceiver]);
    chain.executableSample = contract.address;
    console.log(`Deployed ExecutableSample for ${chain.name} at ${chain.executableSample}.`);
}


async function test(chains, wallet, options) {
    const args = options.args || [];
    const getGasPrice = options.getGasPrice;
    for(const chain of chains) {
        const provider = getDefaultProvider(chain.rpc);
        chain.wallet = wallet.connect(provider);
        chain.contract = new Contract(chain.executableSample, ExecutableSample.abi, chain.wallet);
    }
    const source = chains.find(chain => chain.name == (args[0] || 'Avalanche'));
    const destination = chains.find(chain =>chain.name == (args[1] || 'Fantom'));
    const message = args[2] || `Hello ${destination.name} from ${source.name}, it is ${new Date().toLocaleTimeString()}.`;
    
    async function print() {
        console.log(`value at ${destination.name} is ${await destination.contract.value()}`)
    }
    function sleep(ms) {
        return new Promise((resolve)=> {
            setTimeout(() => {resolve()}, ms);
        })
    }

    console.log('--- Initially ---');
    await print();

    //Set the gasLimit to 1e6 (a safe overestimate) and get the gas price (this is constant and always 1).
    const gasLimit = 3e5;
    const gasPrice = await getGasPrice(source, destination, AddressZero);
    // Set the value on chain1. This will also cause the value on chain2 to change after relay() is called.
    await (await source.contract.setRemoteValue(
        destination.name,
        destination.executableSample,
        message, 
        {value: BigInt(Math.floor(gasLimit * gasPrice))}
    )).wait();
    while(await destination.contract.value() != message) {
        await sleep(2000);
    }

    console.log('--- After ---');
    await print();
}

module.exports = {
    deploy,
    test,
}
