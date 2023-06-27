'use strict';

const {
    EvmRelayer,
} = require('@axelar-network/axelar-local-dev/dist/relay/EvmRelayer');

const {
    createNearNetwork,
    NearRelayer,
} = require('@axelar-network/axelar-local-dev-near');

const {
    createNetwork,
    deployContract,
    relay,
    stopAll,
} = require('@axelar-network/axelar-local-dev');

const path = require('path');

const HelloWorld = rootRequire('./artifacts/examples/near/call-contract/contracts/HelloWorld.sol/HelloWorld.json');

async function deployNearContract(nearClient) {
    // Path to Example contract WASM for NEAR
    const nearWasmFilePath = path.join(path.resolve(__dirname), './contracts/near_axelar_contract_call_example.wasm');

    // Deploy Example contract for NEAR
    const nearContract = await nearClient.createAccountAndDeployContract('near_executable', nearWasmFilePath, 200);

    // Initialize Example contract for NEAR
    await nearContract.call(
        nearContract,
        'new',
        {
            gateway_account_id: nearClient.gatewayAccount.accountId,
        },
        { attachedDeposit: '0' },
    );

    return nearContract;
}

async function execute(chain, wallet, options) {
    const args = options.args || [];

    // Start NEAR network
    const nearClient = await createNearNetwork();

    // Start EVM network
    const evmClient = await createNetwork({
        name: chain.name,
        chainId: chain.chainId,
        port: 8600,
    });

    // Create EVM user
    const evmUser = evmClient.userWallets[0];

    // Deploy Executable contract for EVM
    console.log(`Deploying HelloWorld for ${chain.name}.`);
    const evmContract = await deployContract(evmUser, HelloWorld, [evmClient.gateway.address, evmClient.gasService.address]);
    console.log(`Deployed HelloWorld for ${chain.name} at ${evmContract.address}.`);

    // Deploy NEAR contract
    const nearContract = await deployNearContract(nearClient);

    const messageEvmToNear = args[1] || `Hello NEAR from ${chain.name}, it is ${new Date().toLocaleTimeString()}.`;
    const messageNearToEvm = args[2] || `Hello ${chain.name} from NEAR, it is ${new Date().toLocaleTimeString()}.`;

    async function logValue() {
        console.log(`value at ${chain.name} is "${await evmContract.value()}"`);
        const nearValue = await nearContract.view('get_value', {});
        console.log(`value at NEAR is "${nearValue}"`);
    }

    console.log('--- Initially ---');
    await logValue();

    // Currently, we do not calculate fee for NEAR, so we just use a fixed value.
    const gasLimit = 3e5;
    const gasPrice = 1;

    // Call set method on EVM contract
    await (await evmContract.connect(evmUser).setRemoteValue('near', nearContract.accountId, messageEvmToNear, {
        value: BigInt(Math.floor(gasLimit * gasPrice)),
    })).wait();

    const nearRelayer = new NearRelayer();
    const relayers = { evm: new EvmRelayer({ nearRelayer }), near: nearRelayer };

    // Relay transactions
    await relay(relayers);

    // Call set method on NEAR contract
    await nearClient.callContract(
        nearContract,
        nearContract,
        'set',
        {
            chain: evmClient.name,
            destination_address: evmContract.address,
            value: messageNearToEvm,
        },
        0,
    );

    // Relay transactions
    await relay({
        near: new NearRelayer(),
    });

    console.log('--- After ---');
    await logValue();

    console.log('Stopping networks...');
    await nearClient.stopNetwork();
    await stopAll();
    console.log('--- Done ---');
}

module.exports = {
    execute,
};
