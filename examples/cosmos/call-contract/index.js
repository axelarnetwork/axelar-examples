'use strict';

const { MsgTransfer } = require('cosmjs-types/ibc/applications/transfer/v1/tx');
const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');
const {
    utils: { defaultAbiCoder, arrayify },
} = require('ethers');
const { GasToken } = require('@axelar-network/axelarjs-sdk');

const ExecutableSample = rootRequire('./artifacts/examples/evm/call-contract/ExecutableSample.sol/ExecutableSample.json');

async function deployEVMChains(chain, wallet) {
    console.log(`Deploying ExecutableSample for ${chain.name}.`);
    chain.contract = await deployContract(wallet, ExecutableSample, [chain.gateway, chain.gasService]);
    chain.wallet = wallet;
    console.log(`Deployed ExecutableSample for ${chain.name} at ${chain.contract.address}.`);
}

async function execute(chains, connectedSigner, options) {
    const AXELAR_GMP_ACCOUNT_ADDRESS = 'axelar1dv4u5k73pzqrxlzujxg3qp8kvc3pje7jtdvu72npnt5zhq05ejcsn5qme5';
    const AXELAR_GAS_RECEIVER = 'axelar1zl3rxpp70lmte2xr6c4lgske2fyuj3hupcsvcd';
    const args = options.args || [];
    const { source, destination, wallet, calculateBridgeFee } = options;
    const channelIdToAxelar = source.cosmosConfigs.channelIdToAxelar;
    const messageString = args[2] || `Hello ${destination.name} from ${source.name}, it is ${new Date().toLocaleTimeString()}.`;

    const { address: senderAddress } = (await wallet.getAccounts())[0];

    source.name = args[0]; //HACK

    const feeInAxl = {
        denom: source.assets.find((asset) => asset.symbol === GasToken.AXL).ibcDenom,
        feeAmount: await calculateBridgeFee(source, destination, { symbol: GasToken.AXL }),
    };

    const payload = [
        {
            typeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
            value: MsgTransfer.fromPartial({
                sender: senderAddress,
                receiver: AXELAR_GMP_ACCOUNT_ADDRESS,
                token: {
                    denom: feeInAxl.denom,
                    amount: feeInAxl.feeAmount,
                },
                sourceChannel: channelIdToAxelar,
                sourcePort: 'transfer',
                timeoutHeight: null,
                timeoutTimestamp: (Date.now() + 90) * 1e9,
                memo: JSON.stringify({
                    destination_chain: destination.name,
                    destination_address: destination.contract.address,
                    payload: Buffer.from(arrayify(defaultAbiCoder.encode(['string'], [messageString]))).toString('base64'),
                    fee: { amount: feeInAxl.feeAmount, recipient: AXELAR_GAS_RECEIVER },
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
