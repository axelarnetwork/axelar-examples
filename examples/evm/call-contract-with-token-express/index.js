'use strict';

const { Contract } = require('ethers');
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

// Override the contract address for testnet for now. See README.md for more details.
function overrideContract(env, source, destination, wallet) {
    if (env === 'testnet') {
        const allowedTestnetChains = [sourceChain, destinationChain];

        if (!(allowedTestnetChains.includes(source.name) && allowedTestnetChains.includes(destination.name))) {
            throw new Error(`GMP Express example is only supported on ${sourceChain} or ${destinationChain} chain on testnet`);
        }

        const whitelistedAddresses = {
            [sourceChain]: '0x22a214c3c2C23a370414e2A4b2CF829A76c29A1b',
            [destinationChain]: '0x22a214c3c2C23a370414e2A4b2CF829A76c29A1b',
        };

        source.contract = new Contract(
            whitelistedAddresses[source.name],
            DistributionExpressExecutable.abi,
            wallet.connect(source.provider),
        );
        destination.contract = new Contract(
            whitelistedAddresses[destination.name],
            DistributionExpressExecutable.abi,
            wallet.connect(source.provider),
        );
    }
}

async function execute(_chains, wallet, options) {
    const args = options.args || [];
    const { source, destination, calculateBridgeExpressFee, env } = options;

    // If the example is running on testnet, check that the source and destination chains are supported.
    // TODO: Remove this check once we remove the whitelist on testnet.
    overrideContract(env, source, destination, wallet);

    // Calculate the express fee for the bridge.
    const expressFee = await calculateBridgeExpressFee(source, destination);

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
            console.log(`${account} has ${(await destination.usdc.balanceOf(account)) / 1e6} aUSDC on ${destination.name}`);
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
    const sendTx = await source.contract.sendToMany(destination.name, destination.contract.address, accounts, 'aUSDC', amount, {
        value: expressFee,
    });

    console.log('Sent tokens to distribution contract:', sendTx.hash);

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
