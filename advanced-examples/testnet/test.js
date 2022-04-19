'use strict';

const { utils: { deployContract, setJSON} } = require('@axelar-network/axelar-local-dev');
const { ethers, constants: {AddressZero}, Wallet, Contract, getDefaultProvider } = require('ethers');
const { keccak256, defaultAbiCoder, getIcapAddress } = require('ethers/lib/utils');

const ExecutableSample = require('../../build/ExecutableSample.json');

const env = process.argv[2];
if(evn == null) throw new Error('Need to specify tesntet or local as an argument to this script.');
const chains = require(`./${env}.json`);


const from =  process.argv[3];
const to =  process.argv[4];
const value =  process.argv[5];

(async () => {
    const private_key = keccak256(defaultAbiCoder.encode(['string'], ['A random string to make an account']));
    const address = new Wallet(private_key).address;
    console.log(`Make sure ${address} is funded.`);

    // Create two chains and get a funded user for each
    for(const name in chains) {
        chains[name].provider = getDefaultProvider(chains[name].rpc);
        chains[name].wallet = new Wallet(private_key, chains[name]. provider);
        chains[name].executableSample = new Contract(chains[name].executableSample, ExecutableSample.abi, chains[name].wallet);
    }


    // This is used for logging.
    const print = async () => {
        console.log(`On ${from} the value is: "${await chains[from].executableSample.value()}"`);
        console.log(`On ${to} the value is: "${await chains[to].executableSample.value()}"`);
    }

    console.log('--- Initially ---');
    await print();

    //Set the gasLimit to 1e6 (a safe overestimate) and sets the gas price to 1 (it doesn't matter on testnet for now).
    const gasLimit = 1e6;
    const gasPrice = 1
    // Set the value on ropsten. This will also cause the value on avalanche to change after some time.
    await (await chains[from].executableSample.set(
        to, 
        value, 
        {value: gasLimit * gasPrice}
    )).wait();

    console.log('--- After Setting but Before Relaying ---');
    await print();
    // Wait for the value to reach avalanche.
    while ( await chains[to].executableSample.value() != value ) {
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    console.log('--- After Setting and Relaying ---');
    await print();
})();