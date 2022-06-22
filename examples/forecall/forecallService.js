'use strict';

const { getDefaultProvider, Contract, constants: { AddressZero } } = require('ethers');
const { utils: { deployContract }} = require('@axelar-network/axelar-local-dev');

const DistributionForecallable = require('../../build/DistributionForecallable.json');
const Gateway = require('../../build/IAxelarGateway.json');
const IERC20 = require('../../build/IERC20.json');
const { defaultAbiCoder, keccak256 } = require('ethers/lib/utils');


const env = process.argv[3];
const private_key = process.argv[4] || keccak256(defaultAbiCoder.encode(['string'], ['Forecaller private key.']));
const amount = process.argv[5] || 1000e6;
const gasForExecution = 115000;
const wallet = new Wallet(private_key);

async function getChains(env) {
    if(env == null || (env != 'testnet' && env != 'local')) throw new Error('Need to specify tesntet or local as an argument to this script.');
    let temp;
    if(env == 'local') {
        temp = require(`../info/local.json`);
    } else {
        try {
            temp = require(`../info/testnet.json`);
        } catch {
            temp = testnetInfo;
        }
    }
    const chains = temp;

    for(const chain of [source, destination]) {
        chain.provider = getDefaultProvider(chain.rpc);
        chain.wallet = wallet.connect(provider);
        chain.contract = new Contract(chain.distributionForecallable, DistributionForecallable.abi, chain.wallet);
        chain.gateway = new Contract(chain.gateway, Gateway.abi, chain.wallet);
        const usdcAddress = chain.gateway.tokenAddresses('aUSDC');
        chain.usdc = new Contract(usdcAddress, IERC20.abi, chain.wallet);
        chain.lastBlock = await chain.provider.getBlockNumber();
    }
    return chains;
}

async function fundForecaller(chains, forecaller, amount) {
    //0x8ff26335325ad2c33d87bf8be4a53f28abaac5cf654a42080bc2b91938b1281d
    const private_key_funded = keccak256(defaultAbiCoder.encode(['string'], ['this is a random string to get a random account. You need to provide the private key for a funded account here.']));
    const wallet_funded = new Wallet(private_key_funded);
    console.log(`Trying to give ${amount/1e6} aUSDC to forecaller ${forecaller} from ${wallet_funded.address}.`)
    for(const chain of chains) {
        const balance_funded = await chain.usdc.balanceOf(wallet_funded.address);
        const balance_forecaller = await chain.usdc.balanceOf(forecaller);
        console.log(`On ${chain.name} forecaller has ${balance_forecaller/1e6}, funder has ${balance_funded}.`);
        if(balance_funded + balance_forecaller < amount) throw new Error('Insufficinet funds to fund forecaller');
        const wallet_funded_connected = wallet_funded.connect(chain.provider);
        await (await chain.usdc.connect(wallet_funded_connected).transfer(forecaller, amount - balance_forecaller));
        console.log(`After funding forecaller has ${balance_forecaller/1e6}, funder has ${balance_funded}.`);
    }
}

async function update(chains) {
    for(const chain of chains) {
        const N = chain.provider.getBlockNumber();
        const filter = chain.gateway.CallContractWithToken(chain.contract.address);
        const outgoing = await chain.gateway.queryFilter(filter, chain.lastBlock, N-1);
        chain.lastBlock = N;
        for(const event of outgoing) {
            console.log(`${chain.name}, ${event.args.payload}.`);
        }
    }
}

