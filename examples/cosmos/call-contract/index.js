'use strict';

const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');
const { CosmosClient } = require('@axelar-network/axelar-local-dev-cosmos');
const SendReceive = rootRequire('./artifacts/examples/cosmos/call-contract/evm-contract/SendReceive.sol/SendReceive.json');
const { configPath } = require('../../../config');
const path = require('path');
const fs = require('fs');
const { ethers } = require('ethers');
const { sleep } = require('@axelar-network/axelarjs-sdk');

async function deployOnAltChain() {
    console.log('Deploying SendReceive for Wasm.');
    const cosmosClient = await CosmosClient.create('wasm');
    const wasmPath = path.join(__dirname, 'wasm-contract/artifacts/send_receive.wasm');
    const wasm = await cosmosClient.uploadWasm(wasmPath);
    const { client, address: senderAddress } = await cosmosClient.createFundedSigningClient();

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
    const { wasmContractAddress, signingClient, signingAddress, args } = options;
    const message = args[0] || `hello from ${evmChain.name}`;

    // 1. Execute "send" function on EVM contract
    await evmChain.contract.send('wasm', wasmContractAddress, message, {
        value: ethers.utils.parseEther('0.001'),
    });
    console.log(`Sent message '${message}' from ${evmChain.name} to Wasm.`);

    // 2. Wait until the Cosmos Relayer relays the message to the Wasm chain
    await sleep(10);

    // 3. Check the message on the Wasm chain
    const response = await signingClient.queryContractSmart(wasmContractAddress, {
        get_stored_message: {},
    });

    console.log('Message at Wasm contract:', response.message);

    const wasmMessage = args[0] || `hello from Wasm`;
    const wasmFee = [{ amount: '100000', denom: 'uwasm' }];
    const payload = {
        send_message_evm: {
            destination_chain: evmChain.name,
            destination_address: evmChain.contract.address,
            message: wasmMessage,
        },
    };

    // 4. Execute "send_message_evm" message on Wasm contract
    await signingClient.execute(signingAddress, wasmContractAddress, payload, 'auto', undefined, wasmFee);
    console.log(`\nSent message '${message}' from Wasm to ${evmChain.name}.`);

    // 5. Waiting for the IBC relayer + EVM relayer to relay the message to the EVM chain
    await sleep(20);

    // 6. Check the message on the EVM chain
    const evmResponse = await evmChain.contract.storedMessage();
    console.log('Message at EVM contract:', evmResponse.message);
}

module.exports = {
    deployOnAltChain,
    deploy,
    execute,
    sourceChain: 'Ethereum', // For now, we only support sending cosmos message to Ethereum chain
};
