'use strict';

const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');
const { CosmosClient } = require('@axelar-network/axelar-local-dev-cosmos');
const SendReceive = rootRequire('./artifacts/examples/cosmos/call-contract/evm-contract/SendReceive.sol/SendReceive.json');
const { configPath } = require('../../../config');
const path = require('path');
const fs = require('fs');
const { sleep } = require('@axelar-network/axelarjs-sdk');

async function deployOnAltChain() {
    console.log('Deploying SendReceive for Wasm.');
    const cosmosClient = await CosmosClient.create('wasm');
    const wasmPath = path.join(__dirname, 'wasm-contract/artifacts/send_receive.wasm');
    const wasm = await cosmosClient.uploadWasm(wasmPath);
    const { client, address: senderAddress } = await cosmosClient.generateRandomSigningClient();

    const cosmosConfig = JSON.parse(fs.readFileSync(configPath.localCosmosChains));

    const { contractAddress } = await client.instantiate(
        senderAddress,
        wasm.codeId,
        {
            channel: cosmosConfig.srcChannelId,
        },
        'send_receive',
        'auto',
    );

    console.log('Deployed SendReceive for Wasm at', contractAddress);

    return {
        data: {
            contractAddress,
        },
        path: configPath.localCosmosChains,
    };
}

async function deploy(chain, wallet) {
    console.log(`Deploying SendReceive for ${chain.name}.`);
    chain.contract = await deployContract(wallet, SendReceive, [chain.gateway, chain.gasService, chain.name]);
    console.log(`Deployed SendReceive for ${chain.name} at ${chain.contract.address}.`);
}

async function execute(evmChain, wallet, options) {
    const { wasmContractAddress, signingClient, signingAddress } = options;
    // console.log(`Executing SendReceive from ${evmChain.name} to Wasm.`);
    // const message = `hello from ${evmChain.name}`;
    // await evmChain.contract
    //     .send('wasm', wasmContractAddress, message, {
    //         value: ethers.utils.parseEther('0.001'),
    //     })
    //     .then((tx) => tx.wait());
    // console.log(`Executed SendReceive from ${evmChain.name} to Wasm.`);

    // await sleep(5);

    // const response = await signingClient.queryContractSmart(wasmContractAddress, {
    //     get_stored_message: {},
    // });

    // console.log('Message at Wasm contract:', response.message);

    // execute from wasm to evm
    console.log(`\nExecuting SendReceive from Wasm to ${evmChain.name}.`);
    const wasmMessage = `hello from Wasm 2`;

    await signingClient.execute(
        signingAddress,
        wasmContractAddress,
        {
            send_message_evm: {
                destination_chain: evmChain.name,
                destination_address: evmChain.contract.address,
                message: wasmMessage,
            },
        },
        'auto',
        undefined,
        [{ amount: '100000', denom: 'uwasm' }],
    );

    await sleep(15);

    const evmResponse = await evmChain.contract.storedMessage();
    console.log('Message at EVM contract:', evmResponse.message);
}

module.exports = {
    deployOnAltChain,
    deploy,
    execute,
    sourceChain: 'Ethereum',
};
