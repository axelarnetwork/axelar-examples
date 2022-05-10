'use strict';

const { getDefaultProvider, Contract, constants: { AddressZero } } = require('ethers');
const { deployContractConstant } = require('../../scripts/utils.js');

const StrategySub = require('../../build/StrategyStub.json');
const Strategy = require('../../build/Strategy.json');

const ethereum = "Ethereum"
const fantom = "Fantom"
const name = 'Axelar Cross Chain Strategy Example';

async function deploy(chain, wallet) {
    console.log(`Deploying Chross Chain Strategy for ${chain.name}.`);
    if (chain.name == ethereum){
        const contract = await deployStrategySub(chain, wallet);
        chain.strategy = contract.address;
        console.log(`Deployed StrategyStub for ${chain.name} at ${chain.strategy}.`);
    }
    if (chain.name == fantom){
        const contract = await deployStrategy(chain, wallet);
        chain.strategy = contract.address;
        console.log(`Deployed Strategy for ${chain.name} at ${chain.strategy}.`);
    }
}


async function deployStrategy(chain, wallet) {
    const contract = await deployContractConstant(
        chain.constAddressDeployer, 
        wallet, 
        Strategy, 
        'strategy',
        [AddressZero, chain.gateway, chain.gasReceiver],
    );
    return contract;
}

async function deployStrategySub(chain, wallet) {
    const contract = await deployContractConstant(
        chain.constAddressDeployer, 
        wallet, 
        StrategySub, 
        'strategyStub',
        [AddressZero, chain.gateway, chain.gasReceiver],
    );
    return contract;
}

async function test(chains, wallet, options) {
    const args = options.args || [];
    const getGasPrice = options.getGasPrice;
    const source = chains.find(chain => chain.name == (args[0] || ethereum));
    const destination = chains.find(chain =>chain.name == (args[1] || fantom));
    const accounts = args.slice(3);
    
    async function print() {
        console.log(`Balance at ${source.name} is ${await source.contract.address}`)
        console.log(`Balance at ${destination.name} is ${await destination.contract.address}`)
    }
    
    if(accounts.length == 0)
        accounts.push(wallet.address);

    console.log('--- Before ---');

    for(const chain of [source]) {
        const provider = getDefaultProvider(chain.rpc);
        chain.wallet = wallet.connect(provider);
        chain.contract = new Contract(chain.strategy, StrategySub.abi, chain.wallet);
    }

    for(const chain of [destination]) {
        const provider = getDefaultProvider(chain.rpc);
        chain.wallet = wallet.connect(provider);
        chain.contract = new Contract(chain.strategy, Strategy.abi, chain.wallet);
    }

    console.log('--- After ---');
    await print();
}

module.exports = {
    deploy,
    test,
}
