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
        const router = await deployRouter(chain, wallet);
        chain.router = router.address;
        const contract = await deployStrategy(chain, wallet);
        chain.strategy = contract.address;
        console.log(`Deployed Router for ${chain.name} at ${chain.router}.`);
        console.log(`Deployed Strategy for ${chain.name} at ${chain.strategy}.`);
    }
}


async function deployStrategy(chain, wallet) {
    const contract = await deployContractConstant(
        chain.constAddressDeployer, 
        wallet, 
        Strategy, 
        'strategy',
        [AddressZero, chain.router],
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


async function setupSibbling(contract, whiteListedRouter, name){
    await contract.addSibling(name, whiteListedRouter);
}

async function setupStrategy(contract, whiteListedRouter, strategy){
    await contract.addStrategy(whiteListedRouter, strategy);
}


function sleep(ms) {
    return new Promise((resolve)=> {
        setTimeout(() => {resolve()}, ms);
    })
}


async function test(chains, wallet, options) {
    const args = options.args || [];
    const getGasPrice = options.getGasPrice;
    
    const source = chains.find(chain => chain.name == (args[0] || ethereum));
    const destination = chains.find(chain =>chain.name == (args[1] || fantom));
    const accounts = args.slice(3);

    //Set the gasLimit to 3e5 (a safe overestimate) and get the gas price.
    const gasLimit = 3e5;
    const gasPrice = await getGasPrice(source, destination, AddressZero);
    
    async function print() {
        //console.log(`StrategyStub for ${fantom} ${await source.contract.siblings(fantom)}`)
    }
    
    if(accounts.length == 0)
        accounts.push(wallet.address);

    console.log('--- Before ---');

    //setup ethereum contract/router
    for(const chain of [source]) {
        const provider = getDefaultProvider(chain.rpc);
        chain.wallet = wallet.connect(provider);
        chain.contract = new Contract(chain.strategy, StrategySub.abi, chain.wallet);
        chain.routerContract = new Contract(chain.router, Router.abi, chain.wallet);
        await chain.contract.resetState()
    }

    //setup fantom contract/router
    for(const chain of [destination]) {
        const provider = getDefaultProvider(chain.rpc);
        chain.wallet = wallet.connect(provider);
        chain.contract = new Contract(chain.strategy, Strategy.abi, chain.wallet);
        chain.routerContract = new Contract(chain.router, Router.abi, chain.wallet);
        await chain.contract.resetState()
    }

    console.log('--- Setup Sibblings ---');
    // whitelist router to each other
    await setupSibbling(source.routerContract, destination.routerContract.address, fantom);
    await setupSibbling(destination.routerContract, source.routerContract.address, ethereum);
    await setupStrategy(source.routerContract, destination.routerContract.address, destination.contract.address);
    await setupStrategy(destination.routerContract, source.routerContract.address, source.contract.address);

    // whitelist strategy to each other
    await setupSibbling(source.contract, destination.routerContract.address, fantom)
    await setupSibbling(destination.contract, source.routerContract.address, ethereum)
    
    console.log('--- Start test ---');
    // --------------------------- Test code ------------------------------------------------------

    console.log(`--- Ethereum: StrategyState: ${await source.contract.state()} ---`);
    console.log('--- Ethereum: Trigger prepareReturn() ---');
    await (await source.contract._prepareReturn( 10, {value: BigInt(Math.floor(gasLimit * 100 * gasPrice))})).wait();
    console.log(`--- Ethereum: StrategyState: ${await source.contract.state()} ---`);
    while(await destination.routerContract.executed() == false) {
        await sleep(2000);
    }

    
    console.log(`--- Fantom: Strategy State: ${await destination.contract.state()} ---`);
    console.log(`--- Fantom: Strategy Executed: ${await destination.contract.executed()} ---`);
    while(await destination.contract.executed() == false) {
        await sleep(2000);
    }
    console.log(`--- Fantom: Strategy State: ${await destination.contract.state()} ---`);
    console.log(`--- Fantom: Strategy Executed: ${await destination.contract.executed()} ---`);


    console.log('--- After ---');
    //await print();
}

module.exports = {
    deploy,
    test,
}
