'use strict';

const { getDefaultProvider, Contract, constants: { AddressZero, MaxUint256 } } = require('ethers');
const { utils: { deployContract }} = require('@axelar-network/axelar-local-dev');
const namehash = require('@ensdomains/eth-ens-namehash');

const DistributionENSExecutable = require('../../build/DistributionENSExecutable.json');
const Gateway = require('../../build/IAxelarGateway.json');
const IERC20 = require('../../build/IERC20.json');
const { defaultAbiCoder } = require('ethers/lib/utils');

async function deploy(chain, wallet) {
    console.log(`Deploying DistributionENSExecutable for ${chain.name}.`);
    const contract = await deployContract(wallet, DistributionENSExecutable, [chain.gateway, chain.gasReceiver]);
    chain.DistributionENSExecutable = contract.address;
    console.log(`Deployed DistributionENSExecutable for ${chain.name} at ${chain.DistributionENSExecutable}.`);
}


async function test(chains, wallet, options) {
    const args = options.args || [];
    const getGasPrice = options.getGasPrice;
    const source = chains.find(chain => chain.name == (args[0] || 'Avalanche'));
    const destination = chains.find(chain =>chain.name == (args[1] || 'Polygon'));
    const amount = Math.floor(parseFloat(args[2]))*1e6 || 10e6;
    const accounts = args.slice(3);
    if(accounts.length == 0)
        accounts.push(wallet.address);
    for(const chain of [source, destination]) {
        const provider = getDefaultProvider(chain.rpc);
        console.log(await provider.getBalance(wallet.address));
        chain.wallet = wallet.connect(provider);
        chain.contract = new Contract(chain.DistributionENSExecutable, DistributionENSExecutable.abi, chain.wallet);
        chain.gateway = new Contract(chain.gateway, Gateway.abi, chain.wallet);
        const ustAddress = chain.gateway.tokenAddresses('UST');
        chain.ust = new Contract(ustAddress, IERC20.abi, chain.wallet);
    }
    
    async function print() {
        for(const account of accounts) {
            console.log(`${account} has ${await destination.ust.balanceOf(account)/1e6} UST`)
        }
    }
    function sleep(ms) {
        return new Promise((resolve)=> {
            setTimeout(() => {resolve()}, ms);
        })
    }

    console.log('--- Initially ---');
    await print();
    const gasLimit = 3e5;
    const gasPrice = await getGasPrice(source, destination, AddressZero);
    const balance = BigInt(await destination.ust.balanceOf(accounts[0]));
    await (await source.ust.approve(
        source.contract.address,
        MaxUint256,
    )).wait();
    await (await source.contract.sendToMany(
        destination.name,
        destination.DistributionENSExecutable,
        accounts.map(account => namehash.hash(account)),
        '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
        'UST',
        amount,
        {value: BigInt(Math.floor(gasLimit * gasPrice))}
    )).wait();
    while(BigInt(await destination.ust.balanceOf(accounts[0])) == balance) {
        await sleep(2000);
    }

    console.log('--- After ---');
    await print();
}

module.exports = {
    deploy,
    test,
}
