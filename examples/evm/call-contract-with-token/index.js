'use strict';

const { getDefaultProvider, Contract } = require('ethers');
const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');

const DistributionExecutable = rootRequire(
    './artifacts/examples/evm/call-contract-with-token/DistributionExecutable.sol/DistributionExecutable.json',
);
const Gateway = rootRequire(
    './artifacts/@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol/IAxelarGateway.json',
);
const IERC20 = rootRequire('./artifacts/@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol/IERC20.json');

async function deploy(chain, wallet) {
    console.log(`Deploying DistributionExecutable for ${chain.name}.`);
    const provider = getDefaultProvider(chain.rpc);
    chain.wallet = wallet.connect(provider);
    chain.contract = await deployContract(wallet, DistributionExecutable, [chain.gateway, chain.gasService]);
    const gateway = new Contract(chain.gateway, Gateway.abi, chain.wallet);
    const usdcAddress = await gateway.tokenAddresses('aUSDC');
    chain.usdc = new Contract(usdcAddress, IERC20.abi, chain.wallet);
    console.log(`Deployed DistributionExecutable for ${chain.name} at ${chain.contract.address}.`);
}

async function execute(chains, wallet, options) {
    const args = options.args || [];
    const { source, destination, calculateBridgeFee } = options;
    const amount = Math.floor(parseFloat(args[2])) * 1e6 || 10e6;
    const accounts = args.slice(3);

    if (accounts.length === 0) accounts.push(wallet.address);

    async function logAccountBalances() {
        for (const account of accounts) {
            console.log(`${account} has ${(await destination.usdc.balanceOf(account)) / 1e6} aUSDC`);
        }
    }

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    console.log('--- Initially ---');
    await logAccountBalances();

    const fee = await calculateBridgeFee(source, destination);

    const balance = await destination.usdc.balanceOf(accounts[0]);

    const approveTx = await source.usdc.approve(source.contract.address, amount);
    await approveTx.wait();

    const sendTx = await source.contract.sendToMany(destination.name, destination.contract.address, accounts, 'aUSDC', amount, {
        value: fee,
    });
    await sendTx.wait();

    while (true) {
        const updatedBalance = await destination.usdc.balanceOf(accounts[0]);

        if (updatedBalance.gt(balance)) {
            break;
        }

        await sleep(1000);
    }

    console.log('--- After ---');
    await logAccountBalances();
}

module.exports = {
    deploy,
    execute,
};
