'use strict';

const path = require('path');
const { ethers } = require('ethers');
const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');
const { TxBuilder } = require('@axelar-network/axelar-cgp-sui');
const { loadSuiNetwork, requireObjectId } = require('@axelar-network/axelar-local-dev-sui');
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
    if (!fs.existsSync(configPath.localSuiChains)) {
        throw new Error('Start the local chains first: `pnpm run start` (with sui.enabled true and a Sui network running).');
    }

    const sui = await loadSuiNetwork(JSON.parse(fs.readFileSync(configPath.localSuiChains, 'utf8')));

    const { packageId, publishTxn } = await sui.publishPackage(MOVE_PACKAGE, MOVE_DIR);
    // requireObjectId names what it looked for and lists what was created,
    // rather than failing with "cannot read properties of undefined".
    const singletonId = requireObjectId(publishTxn, `${packageId}::hello_world::Singleton`);

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

    // Poll rather than sleep a fixed interval: a sleep that is too short
    // prints two empty values and reports nothing wrong, which is the least
    // useful way for a cross-chain example to fail.
    await waitForDelivery(
        () => evmChain.contract.value().then((value) => value === messageToEvm),
        `Sui -> ${evmChain.name} was not delivered`,
    );
    await waitForDelivery(
        () => readSuiValue(sui, suiConfig.singletonId).then((value) => value === messageToSui),
        'EVM -> Sui was not delivered',
    );

    console.log('--- After ---');
    await logValues();
}

async function waitForDelivery(delivered, message, timeout = 120000, interval = 1000) {
    const deadline = Date.now() + timeout;

    while (Date.now() < deadline) {
        if (await delivered()) return;

        await sleep(interval);
    }

    throw new Error(`${message} within ${timeout / 1000}s. The relayer is started by \`pnpm run start\`; check it is still running.`);
}

async function readChannelAddress(sui, singletonId) {
    const content = await readSingleton(sui, singletonId);

    return content.fields.channel.fields.id.id;
}

async function readSingleton(sui, singletonId) {
    const object = await sui.client.getObject({ id: singletonId, options: { showContent: true } });

    if (!object.data) {
        throw new Error(
            `Sui object ${singletonId} does not exist. chain-config/local-sui.json is probably stale - ` +
                'it survives `sui start --force-regenesis`, which discards every published object. Delete it and re-run start and deploy.',
        );
    }

    return object.data.content;
}

async function readSuiValue(sui, singletonId) {
    const content = await readSingleton(sui, singletonId);
    const raw = content.fields.value;

    if (!raw || raw.length === 0) return '';

    try {
        return ethers.utils.defaultAbiCoder.decode(['string'], new Uint8Array(raw))[0];
    } catch (error) {
        // execute() accepts any approved message addressed to this Channel, so
        // the stored bytes are not guaranteed to be an abi-encoded string.
        return `<${raw.length} undecodable bytes>`;
    }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = { deployOnAltChain, deploy, execute };
