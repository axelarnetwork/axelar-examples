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

    const fee = await calculateBridgeFee(source, destination);
    const amount = Math.floor(parseFloat(args[2])) * 1e6 || 10e6;

    const accounts = args.slice(3);

    if (accounts.length === 0) accounts.push(wallet.address);

    const initialBalance = await destination.usdc.balanceOf(accounts[0]);

    async function logAccountBalances() {
        for (const account of accounts) {
            console.log(`${account} has ${(await destination.usdc.balanceOf(account)) / 1e6} aUSDC`);
        }
    }

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    console.log('--- Initially ---');
    await logAccountBalances();

    const approveTx = await source.usdc.approve(source.contract.address, amount);
    await approveTx.wait();
    console.log('Approved aUSDC on', source.name);

    const sendTx = await source.contract
        .sendToMany(destination.name, destination.contract.address, accounts, 'aUSDC', amount, {
            value: fee,
        })
        .then((tx) => tx.wait());
    console.log('Sent tokens to distribution contract:', sendTx.transactionHash);

    if (env === 'testnet') {
        console.log(`You can track the GMP transaction status on https://testnet.axelarscan.io/gmp/${sendTx.transactionHash}\n`);
    }

    // const recoveryAPI = new AxelarGMPRecoveryAPI({ environment: Environment.TESTNET });
    // console.log(source.gateway.address, sendTx.transactionHash);
    // let eventIndex = -1;

    // for (let i = 0; i < sendTx.events.length; i++) {
    //     if (sendTx.events[i].address === source.gateway.address) {
    //         eventIndex = i;
    //     }
    // }

    // const commandId = recoveryAPI.getCidFromSrcTxHash(destination.name, sendTx.transactionHash, eventIndex);
    // const payload = ethers.utils.defaultAbiCoder.encode(['address[]'], [accounts]);

    // await destination.contract.expressExecuteWithToken('0x' + commandId, source.name, source.contract.address, payload, 'aUSDC', amount);

    // In this example, you won't notice much different on local because everything is fast there, try testnet env!.
    while ((await destination.usdc.balanceOf(accounts[0])).eq(initialBalance)) {
        await sleep(1000);
    }

    console.log('--- After ---');
    await logAccountBalances();
}

module.exports = {
    deploy,
    execute,
    sourceChain,
    destinationChain,
};
