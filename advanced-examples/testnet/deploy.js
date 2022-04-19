'use strict';

const { utils: { deployContract, setJSON} } = require('@axelar-network/axelar-local-dev');
const { ethers, constants: {AddressZero}, Wallet, Contract } = require('ethers');
const { keccak256, defaultAbiCoder, getIcapAddress } = require('ethers/lib/utils');

const ExecutableSample = require('../../build/ExecutableSample.json');
const env = process.argv[2];
if(evn == null) throw new Error('Need to specify tesntet or local as an argument to this script.');
const chains = require(`./${env}.json`);


(async () => {
    const private_key = keccak256(defaultAbiCoder.encode(['string'], ['this is a random string to get a random account. You need to provide the private key for a funded account here.']));
    const address = new Wallet(private_key).address;
    console.log(address, '<-- Fund this');
    const contracts = {};
    for(const name in chains) {
        const rpc = chains[name].rpc;
        const provider = ethers.getDefaultProvider(rpc);
        const wallet = new Wallet(private_key, provider);
        console.log(`Deployer has ${await provider.getBalance(address)/1e18} ETH.`);
        console.log(`Deploying ExecutableSample for ${name}.`);
        contracts[name] = await deployContract(wallet, ExecutableSample, [chains[name].gateway, chains[name].gasReceiver]);
        console.log(`Deployed at ${contracts[name].address}.`);
        chains[name].executableSample = contracts[name].address;
    }
    setJSON(chains, `./examples/testnet/${env}.json`);
    for(const name in chains) {
        const rpc = chains[name].rpc;
        const provider = ethers.getDefaultProvider(rpc);
        const wallet = new Wallet(private_key, provider);
        const contract = new Contract(chains[name].executableSample, ExecutableSample.abi, wallet);
        for(const otherName in chains) {
            if(otherName == name) continue;
            if(await contract.siblings(otherName) == chains[otherName].executableSample) continue;
            console.log(`Setting sibling for ${name} -> ${otherName}`);
            await (await contract.addSibling(otherName, chains[otherName].executableSample));
        }
    }

})();