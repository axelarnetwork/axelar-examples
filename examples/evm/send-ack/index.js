'use strict';

const {
    getDefaultProvider,
    constants: { AddressZero },
    utils: { defaultAbiCoder },
    BigNumber,
} = require('ethers');
const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');

const SendAckReceiver = rootRequire(
    './artifacts/examples/evm/send-ack/SendAckReceiverImplementation.sol/SendAckReceiverImplementation.json',
);
const SendAckSender = rootRequire('./artifacts/examples/evm/send-ack/SendAckSender.sol/SendAckSender.json');

const time = new Date().getTime();

async function deploy(chain, wallet) {
    chain.provider = getDefaultProvider(chain.rpc);
    chain.wallet = wallet.connect(chain.provider);

    console.log(`Deploying SendAckSender for ${chain.name}.`);
    chain.sender = await deployContract(wallet, SendAckSender, [chain.gateway, chain.gasService, chain.name]);
    console.log(`Deployed SendAckSender for ${chain.name} at ${chain.sender.address}.`);

    console.log(`Deploying SendAckReceiverImplementation for ${chain.name}.`);
    chain.receiver = await deployContract(wallet, SendAckReceiver, [chain.gateway]);
    console.log(`Deployed SendAckReceiverImplementation for ${chain.name} at ${chain.receiver.address}.`);
}

async function execute(chains, wallet, options) {
    const { source, destination, calculateBridgeFee, args } = options;
    const message = args[2] || `Hello, the time is ${time}.`;
    const payload = defaultAbiCoder.encode(['string'], [message]);

    async function print() {
        const length = await destination.receiver.messagesLength();
        console.log(
            `SendAckReceiverImplementation at ${destination.name} has ${length} messages and the last one is "${
                length > 0 ? await destination.receiver.messages(length - 1) : ''
            }".`,
        );
    }

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    console.log('--- Initially ---');
    await print();

    const feeRemote = await calculateBridgeFee(source, destination);
    const feeSource = await calculateBridgeFee(source, source);

    const tx = await (
        await source.sender.sendContractCall(destination.name, destination.receiver.address, payload, gasAmountRemote, {
            value: BigNumber.from(feeRemote).add(feeSource),
        })
    ).wait();
    const event = tx.events.find((event) => event.event === 'ContractCallSent');
    const nonce = event.args.nonce;

    while (!(await source.sender.executed(nonce))) {
        console.log('MessageLength', await destination.receiver.messagesLength().then((val) => val.toString()));
        console.log('Test', await source.sender.executed(nonce));
        await sleep(2000);
    }

    console.log('--- After ---');
    await print();
}

module.exports = {
    deploy,
    execute,
};
