'use strict';

const {
    constants: { AddressZero },
    utils: { defaultAbiCoder },
} = require('ethers');
const { deployUpgradable } = require('@axelar-network/axelar-gmp-sdk-solidity');

const ExampleProxy = require('../../artifacts/examples/Proxy.sol/ExampleProxy.json');
const ERC20CrossChain = require('../../artifacts/examples/cross-chain-token/ERC20CrossChain.sol/ERC20CrossChain.json');

const name = 'An Awesome Axelar Cross Chain Token';
const symbol = 'AACCT';
const decimals = 13;

async function deploy(chain, wallet) {
    console.log(`Deploying ERC20CrossChain for ${chain.name}.`);
    const contract = await deployUpgradable(
        chain.constAddressDeployer,
        wallet,
        ERC20CrossChain,
        ExampleProxy,
        [chain.gateway, chain.gasReceiver, decimals],
        [],
        defaultAbiCoder.encode(['string', 'string'], [name, symbol]),
        'cross-chain-token',
    );
    chain.crossChainToken = contract;
    console.log(`Deployed ERC20CrossChain for ${chain.name} at ${chain.crossChainToken.address}.`);
}

async function test(chains, wallet, options) {
    const args = options.args || [];
    const getGasPrice = options.getGasPrice;

    const source = chains.find((chain) => chain.name === (args[0] || 'Avalanche'));
    const destination = chains.find((chain) => chain.name === (args[1] || 'Fantom'));
    console.log(destination);
    const amount = parseInt(args[2]) || 1e5;

    async function print() {
        console.log(`Balance at ${source.name} is ${await source.crossChainToken.balanceOf(wallet.address)}`);
        console.log(`Balance at ${destination.name} is ${await destination.crossChainToken.balanceOf(wallet.address)}`);
    }

    function sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, ms);
        });
    }

    const initialBalance = (await destination.crossChainToken.balanceOf(wallet.address)).toNumber();
    console.log('--- Initially ---');
    await print();

    // Set the gasLimit to 3e5 (a safe overestimate) and get the gas price (this is constant and always 1).
    const gasLimit = 3e5;
    const gasPrice = await getGasPrice(source, destination, AddressZero);
    await (await source.crossChainToken.giveMe(amount)).wait();
    console.log('--- After getting some token on the source chain ---');
    await print();

    await (
        await source.crossChainToken.transferRemote(destination.name, wallet.address, amount, {
            value: BigInt(Math.floor(gasLimit * gasPrice)),
        })
    ).wait();

    while ((await destination.crossChainToken.balanceOf(wallet.address)).toNumber() === initialBalance) {
        await sleep(2000);
    }

    console.log('--- After ---');
    await print();
}

module.exports = {
    deploy,
    test,
};
