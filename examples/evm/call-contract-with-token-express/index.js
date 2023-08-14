'use strict';

const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');

const DistributionExpressExecutable = rootRequire(
    './artifacts/examples/evm/call-contract-with-token-express/DistributionExpressExecutable.sol/DistributionExpressExecutable.json',
);

async function deploy(chain, wallet) {
    chain.wallet = wallet;
    console.log(`Deploying DistributionExpressExecutable for ${chain.name}.`);
    chain.contract = await deployContract(wallet, DistributionExpressExecutable, [chain.gateway, chain.gasService]);
    console.log(`Deployed DistributionExpressExecutable for ${chain.name} at`, chain.contract.address);
}

const sourceChain = 'Polygon';
const destinationChain = 'Avalanche';

async function execute(_chains, wallet, options) {
    const args = options.args || [];
    const { source, destination, calculateBridgeFee, env } = options;

    // Calculate the fee for the bridge.
    const fee = await calculateBridgeFee(source, destination);

    // Get the amount to send.
    const amount = Math.floor(parseFloat(args[2])) * 1e6 || 10e6;

    // Get the accounts to send to.
    const accounts = args.slice(3);

    // If no accounts are specified, send to the default wallet address.
    if (accounts.length === 0) accounts.push(wallet.address);

    // Get the balance of the first account.
    const initialBalance = await destination.usdc.balanceOf(accounts[0]);

    async function logAccountBalances() {
        for (const account of accounts) {
            console.log(`${account} has ${(await destination.usdc.balanceOf(account)) / 1e6} aUSDC`);
        }
    }

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    console.log('--- Initially ---');

    // Log the balances of the accounts.
    await logAccountBalances();


    // Approve the distribution contract to spend aUSDC.
    const approveTx = await source.usdc.approve(source.contract.address, amount);
    await approveTx.wait();
    console.log('Approved aUSDC on', source.name);

    // Send tokens to the distribution contract.
    const sendTx = await source.contract
        .sendToMany(destination.name, destination.contract.address, accounts, 'aUSDC', amount, {
            value: fee,
        })
        .then((tx) => tx.wait());

    console.log('Sent tokens to distribution contract:', sendTx.transactionHash);

    if (env === 'testnet') {
        console.log(`You can track the GMP transaction status on https://testnet.axelarscan.io/gmp/${sendTx.transactionHash}\n`);
    }

    // Wait for the distribution to complete by checking the balance of the first account.
    while ((await destination.usdc.balanceOf(accounts[0])).eq(initialBalance)) {
        await sleep(1000);
    }

    console.log('--- After ---');
    // Log the balances of the accounts.
    await logAccountBalances();
}

module.exports = {
    deploy,
    execute,
    sourceChain,
    destinationChain,
};
