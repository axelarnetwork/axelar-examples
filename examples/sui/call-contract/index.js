'use strict';

const { Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');
const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');
const { ethers } = require('ethers');
const { TransactionBlock } = require('@mysten/sui.js/transactions');
const { SuiNetwork } = require('@axelar-network/axelar-local-dev-sui');
const path = require('path');
const HelloWorld = rootRequire('./artifacts/examples/sui/call-contract/contracts/HelloWorld.sol/HelloWorld.json');

async function preDeploy(chains) {
    console.log(`Deploying HelloWorld for Sui.`);
    const client = new SuiNetwork(process.env.SUI_URL, process.env.SUI_FAUCET_URL);
    await client.init();
    const response = await client.deploy(path.join(__dirname, 'modules'));

    for (const chain of chains) {
        chain.sui = {
            packageId: response.packages[0].packageId,
        };
    }

    console.log(`Deployed HelloWorld module for Sui.`);
}

async function deploy(chain, wallet) {
    console.log(`Deploying HelloWorld for ${chain.name}.`);
    chain.contract = await deployContract(wallet, HelloWorld, [chain.gateway, chain.gasService]);
    console.log(`Deployed HelloWorld for ${chain.name} at ${chain.contract.address}.`);
}

async function execute(evmChain, wallet, options) {
    const args = options.args || [];
    const client = new SuiNetwork(process.env.SUI_URL, process.env.SUI_FAUCET_URL);
    const sender = new Ed25519Keypair();
    await client.fundWallet(sender.toSuiAddress());

    const messageEvmToSui = args[1] || `Hello Sui from ${evmChain.name}, it is ${new Date().toLocaleTimeString()}.`;
    const messageSuiToEvm = args[2] || `Hello ${evmChain.name} from Sui, it is ${new Date().toLocaleTimeString()}.`;

    async function logValue() {
        console.log(`value at ${evmChain.name} is "${await evmChain.contract.value()}"`);
        const { data } = await client.queryEvents({
            query: {
                MoveModule: {
                    module: `hello_world`,
                    package: evmChain.sui.packageId,
                },
            },
            limit: 1,
        });

        const msg = data[0].parsedJson.updated_message;

        console.log(`value at Sui is "${msg}"`);
    }

    console.log('--- Initially ---');
    await logValue();

    // Send message from EVM to Sui.
    const tx = await evmChain.contract.setRemoteValue('sui', `${evmChain.sui.packageId}::hello_world`, messageEvmToSui, {
        value: 1, // Currently, we didn't check for the fee, so we set it to 1.
    });
    await tx.wait();

    // Send message from Sui to EVM.
    const payload = ethers.utils.defaultAbiCoder.encode(['string'], [messageSuiToEvm]);
    const tb = new TransactionBlock();
    tb.moveCall({
        target: `${evmChain.sui.packageId}::hello_world::call`,
        arguments: [tb.pure(evmChain.name), tb.pure(evmChain.contract.address), tb.pure(payload), tb.pure(1)],
    });
    await client.execute(tb, sender);

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    await sleep(5000);

    console.log('--- After ---');
    await logValue();
}

module.exports = {
    preDeploy,
    deploy,
    execute,
};
