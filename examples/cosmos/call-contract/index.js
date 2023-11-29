'use strict';

const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');
const { CosmosClient } = require('@axelar-network/axelar-local-dev-cosmos');
const SendReceive = rootRequire('./artifacts/examples/cosmos/call-contract/evm-contract/SendReceive.sol/SendReceive.json');
const { configPath } = require('../../../config');
const path = require('path');
const fs = require('fs');

async function deployOnAltChain() {
    const cosmosClient = await CosmosClient.create('wasm');
    console.log('Created Cosmos client');
    const wasmPath = path.join(__dirname, 'wasm-contract/artifacts/send_receive.wasm');
    const wasm = await cosmosClient.uploadWasm(wasmPath);
    console.log('Uploaded wasm contract to wasm chain:', wasm.transactionHash);
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

    console.log('Instantiated contract on wasm chain with address: ', contractAddress);

    return {
      data: {
        contractAddress,
      },
      path: configPath.localCosmosChains,
    }
}

async function deploy(chain, wallet) {
    // Deploy contract on EVM chain
    deployContract(wallet, SendReceive, [chain.gateway, chain.gasService]);
}

async function execute(evmChain, wallet, options) {
    // execute from evm to wasm
    evmChain.contract.send('wasm');

    // execute from wasm to evm
}

module.exports = {
    deployOnAltChain,
    deploy,
    execute,
};
