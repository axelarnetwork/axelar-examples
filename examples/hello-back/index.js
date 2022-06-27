'use strict';

const {
    getDefaultProvider,
    Contract,
    constants: { AddressZero },
} = require('ethers');
const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');
const { defaultAbiCoder } = require('ethers/lib/utils');

const Hello = require('../../artifacts/examples/hello-back/Hello.sol/Hello.json');
const HelloBack = require('../../artifacts/examples/hello-back/HelloBack.sol/HelloBack.json');
const Gateway = require('../../artifacts/@axelar-network/axelar-cgp-solidity/contracts/interfaces/IAxelarGateway.sol/IAxelarGateway.json');
const IERC20 = require('../../artifacts/@axelar-network/axelar-cgp-solidity/contracts/interfaces/IERC20.sol/IERC20.json');

async function deploy(chain, wallet) {
    const hello = await deployContract(wallet, Hello, [chain.gateway, chain.gasReceiver]);
    chain.hello = hello.address;
    console.log(`Deployed Hello for ${chain.name} at ${chain.hello}.`);

    const helloBack = await deployContract(wallet, HelloBack, [chain.gateway, chain.gasReceiver]);
    chain.helloBack = helloBack.address;
    console.log(`Deployed HelloBack for ${chain.name} at ${chain.helloBack}.`);
}

async function test(chains, wallet, options) {
    const args = options.args || [];
    const getGasPrice = options.getGasPrice;
    const source = chains.find((chain) => chain.name == (args[0] || 'Avalanche'));
    const destination = chains.find((chain) => chain.name == (args[1] || 'Fantom'));
    const amount = Math.floor(parseFloat(args[2])) * 1e6 || 10e6;
    const message = args[3];
    const accounts = [args[4]];
    if (accounts.length == 0) accounts.push(wallet.address);
    for (const chain of [source, destination]) {
        const provider = getDefaultProvider(chain.rpc);
        chain.wallet = wallet.connect(provider);
        chain.gateway = new Contract(chain.gateway, Gateway.abi, chain.wallet);
        chain.hello = new Contract(chain.hello, Hello.abi, chain.wallet);
        chain.helloBack = new Contract(chain.helloBack, HelloBack.abi, chain.wallet);
        const usdcAddress = chain.gateway.tokenAddresses('aUSDC');
        chain.usdc = new Contract(usdcAddress, IERC20.abi, chain.wallet);
    }

    async function print() {
        console.log(`${source.wallet.address} has ${await source.usdc.balanceOf(source.wallet.address) / 1e6} aUSDC on ${source.name}`);
        for (const account of accounts) {
            console.log(`${account} has ${(await destination.usdc.balanceOf(account)) / 1e6} aUSDC on ${destination.name}`);
        }
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

    const gasLimit = 3e6;
    const gasPriceFromSource = gasLimit; //BigInt(Math.floor(gasLimit * (await getGasPrice(source, destination, AddressZero)))); TODO: the gasGasPrice method in testnet I think only works for native ether
    const gasPriceFromDestination = gasLimit; //BigInt(Math.floor(gasLimit * (await getGasPrice(destination, source, AddressZero)))); TODO: the gasGasPrice method in testnet I think only works for native ether
    const finalTokenRecipient = accounts[0]; 
    const balance = BigInt(await destination.usdc.balanceOf(finalTokenRecipient));
    
    await (await source.usdc.approve(source.hello.address, amount)).wait();
    await (
        await source.hello.sayHello(
            destination.name,
            destination.helloBack.address,
            defaultAbiCoder.encode(['string'], [message]),
            'aUSDC',
            amount,
            finalTokenRecipient,
            gasPriceFromSource,
            gasPriceFromDestination,
        )
    ).wait();

    while (BigInt(await destination.usdc.balanceOf(finalTokenRecipient)) == balance) {
        console.log('...waiting for destination chain to update balance for final recipient');
        await sleep(2000);
    }

    while ((await source.hello.message()) != message) {
        console.log('...waiting for source chain to receive confirmation response back');
        await sleep(2000);
    }

    console.log('--- After ---');
    await print();
}

module.exports = {
    deploy,
    test,
};
