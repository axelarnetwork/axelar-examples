'use strict';

const {
    getDefaultProvider,
    constants: { AddressZero },
    utils: { defaultAbiCoder },
} = require('ethers');
const { deployUpgradable } = require('@axelar-network/axelar-gmp-sdk-solidity');

const ExampleProxy = rootRequire('./artifacts/examples/evm/Proxy.sol/ExampleProxy.json');
const ERC20CrossChain = rootRequire('./artifacts/examples/evm/cross-chain-token/ERC20CrossChain.sol/ERC20CrossChain.json');

const name = 'An Awesome Axelar Cross Chain Token';
const symbol = 'AACCT';
const decimals = 13;

async function deploy(chain, wallet) {
    console.log(`Deploying ERC20CrossChain for ${chain.name}.`);
    const provider = getDefaultProvider(chain.rpc);
    chain.wallet = wallet.connect(provider);
    chain.contract = await deployUpgradable(
        chain.constAddressDeployer,
        wallet,
        ERC20CrossChain,
        ExampleProxy,
        [chain.gateway, chain.gasService, decimals],
        [],
        defaultAbiCoder.encode(['string', 'string'], [name, symbol]),
        'cross-chain-token',
    );
    console.log(`Deployed ERC20CrossChain for ${chain.name} at ${chain.contract.address}.`);
}

async function execute(chains, wallet, options) {
    const args = options.args || [];
    const { source, destination, calculateBridgeFee } = options;
    const amount = parseInt(args[2]) || 1e5;

    async function print() {
        console.log(`Balance at ${source.name} is ${await source.contract.balanceOf(wallet.address)}`);
        console.log(`Balance at ${destination.name} is ${await destination.contract.balanceOf(wallet.address)}`);
    }

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const initialBalance = await destination.contract.balanceOf(wallet.address);
    console.log('--- Initially ---');
    await print();

    const fee = await calculateBridgeFee(source, destination);
    await (await source.contract.giveMe(amount)).wait();
    console.log('--- After getting some token on the source chain ---');
    await print();

    await (
        await source.contract.transferRemote(destination.name, wallet.address, amount, {
            value: fee,
        })
    ).wait();

    while (true) {
        const updatedBalance = await destination.contract.balanceOf(wallet.address);
        if (updatedBalance.gt(initialBalance)) break;
        await sleep(2000);
    }

    console.log('--- After ---');
    await print();
}

module.exports = {
    deploy,
    execute,
};
