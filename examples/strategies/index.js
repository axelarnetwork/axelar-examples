'use strict';

const { getDefaultProvider, Contract, constants: { AddressZero } } = require('ethers');
const { deployContractConstant } = require('../../scripts/utils.js');

const StrategySub = require('../../build/StrategyStub.json');
const Strategy = require('../../build/Strategy.json');
const Router = require('../../build/Router.json');

const ethereum = "Ethereum"
const fantom = "Fantom"
const name = 'Axelar Cross Chain Strategy Example';

async function deploy(chain, wallet) {
    console.log(`Deploying Chross Chain Strategy for ${chain.name}.`);
    if (chain.name == ethereum){
        const router = await deployRouter(chain, wallet);
        chain.router = router.address;
        const contract = await deployStrategyStub(chain, wallet);
        chain.strategy = contract.address;
        console.log(`Deployed Router for ${chain.name} at ${chain.router}.`);
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

async function deployStrategyStub(chain, wallet) {
    const contract = await deployContractConstant(
        chain.constAddressDeployer, 
        wallet, 
        StrategySub, 
        'strategyStub',
        [AddressZero, chain.router],
    );
    return contract;
}

async function deployRouter(chain, wallet) {
    const contract = await deployContractConstant(
        chain.constAddressDeployer, 
        wallet, 
        Router, 
        'router',
        [chain.gateway, chain.gasReceiver],
    );
    return contract;
}

function sleep(ms) {
    return new Promise((resolve)=> {
        setTimeout(() => {resolve()}, ms);
    })
}

async function test(chains, wallet, options) {
    const args = options.args || [];
    const getGasPrice = options.getGasPrice;
    //Set the gasLimit to 3e5 (a safe overestimate) and get the gas price.
    const source = chains.find(chain => chain.name == (args[0] || ethereum));
    const destination = chains.find(chain =>chain.name == (args[1] || fantom));
    const accounts = args.slice(3);

    const gasLimit = 3e5;
    const gasPrice = await getGasPrice(source, destination, AddressZero);
    
    async function print() {
        console.log(`StrategyStub for ${fantom} ${await source.contract.siblings(fantom)}`)
    }
    
    if(accounts.length == 0)
        accounts.push(wallet.address);

    console.log('--- Before ---');

    for(const chain of [source]) {
        const provider = getDefaultProvider(chain.rpc);
        chain.wallet = wallet.connect(provider);
        chain.contract = new Contract(chain.strategy, StrategySub.abi, chain.wallet);

        // add sibbling
        console.log(destination.strategy)
        await chain.contract.addSibling(destination.name, destination.strategy);
    }

    for(const chain of [destination]) {
        const provider = getDefaultProvider(chain.rpc);
        chain.wallet = wallet.connect(provider);
        chain.contract = new Contract(chain.strategy, Strategy.abi, chain.wallet);
        await chain.contract.addSibling(source.name, source.strategy);
        await chain.contract.flipState()
        console.log(`--- Fantom: Strategy State: ${await chain.contract.state()} ---`);
    }

     
    //console.log(`--- StrategyState: ${await chain.contract.state()} ---`);
    console.log('--- Ethereum: flipState() ---');
    await source.contract.flipState()
    console.log(`--- Ethereum: StrategyState: ${await source.contract.state()} ---`);
    console.log('--- Ethereum: Send Message to Fantom() ---');
    await (await source.contract._prepareReturn( 10, {value: BigInt(Math.floor(gasLimit * gasPrice))})).wait();
    console.log(`--- Ethereum: StrategyState: ${await source.contract.state()} ---`);
    

    
    console.log(`--- Fantom: Strategy State: ${await destination.contract.state()} ---`);
    console.log(`--- Fantom: Strategy Executed: ${await destination.contract.executed()} ---`);
    while(await destination.contract.state() == 0) {
        await sleep(2000);
    }
    console.log(`--- Fantom: Strategy State: ${await destination.contract.state()} ---`);
    console.log(`--- Fantom: Strategy Executed: ${await destination.contract.executed()} ---`);


    console.log('--- After ---');
    await print();
}

module.exports = {
    deploy,
    test,
}
