'use strict';

const path = require('path');
const { ethers } = require('ethers');
const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');
const { TxBuilder } = require('@axelar-network/axelar-cgp-sui');
const { loadSuiNetwork } = require('@axelar-network/axelar-local-dev-sui');
const fs = require('fs');
const { configPath } = require('../../../config');

const HelloWorld = rootRequire('./artifacts/examples/sui/call-contract/contracts/HelloWorld.sol/HelloWorld.json');

const MOVE_DIR = path.join(__dirname, 'move');
const MOVE_PACKAGE = 'hello_world';

// The relayer matches the destination chain in lowercase.
const SUI_CHAIN_NAME = 'sui';

async function deployOnAltChain() {
    console.log('Deploying HelloWorld for Sui.');

    // The harness calls this with no arguments, and `deploy` is a different
    // process from `start`, so reconnect from the side-file that start wrote.
    const sui = await loadSuiNetwork(JSON.parse(fs.readFileSync(configPath.localSuiChains, 'utf8')));

    const { packageId, publishTxn } = await sui.publishPackage(MOVE_PACKAGE, MOVE_DIR);
    const singletonId = publishTxn.objectChanges.find((change) => change.objectType === `${packageId}::hello_world::Singleton`).objectId;

    // Without this the relayer cannot work out how to deliver to us, and
    // inbound messages are silently never executed.
    const builder = new TxBuilder(sui.client);
    await builder.moveCall({
        target: `${packageId}::hello_world::register_transaction`,
        arguments: [sui.discoveryId, singletonId],
    });
    await builder.signAndExecute(sui.deployer, {});

    const channelAddress = await readChannelAddress(sui, singletonId);

    console.log(`Deployed HelloWorld for Sui at ${packageId} (channel ${channelAddress}).`);

    return {
        data: { packageId, singletonId, channelAddress },
        path: configPath.localSuiChains,
    };
}

async function deploy(chain, wallet) {
    console.log(`Deploying HelloWorld for ${chain.name}.`);
    chain.contract = await deployContract(wallet, HelloWorld, [chain.gateway, chain.gasService]);
    console.log(`Deployed HelloWorld for ${chain.name} at ${chain.contract.address}.`);
}

async function execute(evmChain, wallet, options) {
    const { args, sui, suiConfig } = options;
    const messageToSui = args[1] || `Hello Sui from ${evmChain.name}, it is ${new Date().toLocaleTimeString()}.`;
    const messageToEvm = args[2] || `Hello ${evmChain.name} from Sui, it is ${new Date().toLocaleTimeString()}.`;

    async function logValues() {
        const evmValue = await evmChain.contract.value();
        const suiValue = await readSuiValue(sui, suiConfig.singletonId);

        console.log(`Value at ${evmChain.name} is "${evmValue}"`);
        console.log(`Value at Sui is "${suiValue}"`);
    }

    console.log('--- Initially ---');
    await logValues();

    // EVM -> Sui. The destination is the Channel object address, not the
    // package id: the Sui gateway routes an approved message to a Channel.
    await (
        await evmChain.contract.setRemoteValue(SUI_CHAIN_NAME, suiConfig.channelAddress, messageToSui, {
            value: ethers.utils.parseEther('0.001'),
        })
    ).wait();

    // Sui -> EVM. HelloWorld._execute abi.decodes a string, so send the
    // payload abi-encoded rather than as raw utf8 bytes.
    const payload = ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(['string'], [messageToEvm]));
    const builder = new TxBuilder(sui.client);
    const [gas] = builder.tx.splitCoins(builder.tx.gas, [1_000_000]);

    await builder.moveCall({
        target: `${suiConfig.packageId}::hello_world::set_remote_value`,
        arguments: [
            suiConfig.singletonId,
            sui.gatewayId,
            sui.gasServiceId,
            evmChain.name,
            evmChain.contract.address,
            payload,
            sui.getExecutorAddress(),
            gas,
        ],
    });
    await builder.signAndExecute(sui.deployer, {});

    await sleep(15000);

    console.log('--- After ---');
    await logValues();
}

async function readChannelAddress(sui, singletonId) {
    const object = await sui.client.getObject({ id: singletonId, options: { showContent: true } });

    return object.data.content.fields.channel.fields.id.id;
}

async function readSuiValue(sui, singletonId) {
    const object = await sui.client.getObject({ id: singletonId, options: { showContent: true } });
    const raw = object.data.content.fields.value;

    if (!raw || raw.length === 0) return '';

    return ethers.utils.defaultAbiCoder.decode(['string'], new Uint8Array(raw))[0];
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = { deployOnAltChain, deploy, execute };
