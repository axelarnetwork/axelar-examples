'use strict';

const { MsgTransfer } = require('cosmjs-types/ibc/applications/transfer/v1/tx');
const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');
const {
    utils: { defaultAbiCoder, arrayify },
} = require('ethers');

const ExecutableSample = rootRequire('./artifacts/examples/evm/call-contract/ExecutableSample.sol/ExecutableSample.json');

async function deployEVMChains(chain, wallet) {
    console.log(`Deploying ExecutableSample for ${chain.name}.`);
    chain.contract = await deployContract(wallet, ExecutableSample, [chain.gateway, chain.gasService]);
    chain.wallet = wallet;
    console.log(`Deployed ExecutableSample for ${chain.name} at ${chain.contract.address}.`);
}

async function execute(chains, connectedSigner, options) {
    const AXELAR_GMP_ACCOUNT_ADDRESS = 'axelar1dv4u5k73pzqrxlzujxg3qp8kvc3pje7jtdvu72npnt5zhq05ejcsn5qme5';
    const args = options.args || [];
    const { source, destination, wallet } = options;
    const channelIdToAxelar = source.cosmosConfigs.channelIdToAxelar;
    const messageString = `Hello ${destination.name} from ${source.name}, it is ${new Date().toLocaleTimeString()}.` || args[2];

    const { address: senderAddress } = (await wallet.getAccounts())[0];

    const payload = [
        {
            typeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
            value: MsgTransfer.fromPartial({
                sender: senderAddress,
                receiver: AXELAR_GMP_ACCOUNT_ADDRESS,
                token: {
                    denom: 'ibc/9463E39D230614B313B487836D13A392BD1731928713D4C8427A083627048DB3',
                    amount: '1',
                },
                sourceChannel: channelIdToAxelar,
                sourcePort: 'transfer',
                timeoutHeight: null,
                timeoutTimestamp: (Date.now() + 90) * 1e9,
                memo: JSON.stringify({
                    destination_chain: destination.name,
                    destination_address: destination.contract.address,
                    payload: Buffer.from(arrayify(defaultAbiCoder.encode(['string'], [messageString]))).toString('base64'),
                    fee: { amount: '1', recipient: 'axelar1zl3rxpp70lmte2xr6c4lgske2fyuj3hupcsvcd' },
                    type: 1,
                }),
            }),
        },
    ];

    const tx = await connectedSigner.signAndBroadcast(senderAddress, payload, {
        gas: '250000',
        amount: [{ denom: 'uosmo', amount: '30000' }],
    });
    console.log({ tx });

    async function logValue() {
        console.log('logValue', { destination: destination.contract });
        console.log(`value at ${destination.name} is "${await destination.contract.value()}"`);
    }

    console.log('--- Initially ---');
    await logValue();

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    while ((await destination.contract.value()) !== message) {
        await sleep(1000);
    }

    console.log('--- After ---');
    await logValue();
}

module.exports = {
    execute,
    deploy: deployEVMChains,
};
