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

async function deploy(chain, wallet) {
    chain.provider = getDefaultProvider(chain.rpc);
    chain.wallet = wallet.connect(chain.provider);

    console.log(`Deploying SendAckSender for ${chain.name}.`);
    chain.contract = await deployContract(wallet, SendAckSender, [chain.gateway, chain.gasService, chain.name]);
    console.log(`Deployed SendAckSender for ${chain.name} at ${chain.contract.address}.`);

    console.log(`Deploying SendAckReceiverImplementation for ${chain.name}.`);
    chain.receiver = await deployContract(wallet, SendAckReceiver, [chain.gateway]);
    console.log(`Deployed SendAckReceiverImplementation for ${chain.name} at ${chain.receiver.address}.`);
}

async function execute(chains, wallet, options) {
    const { source, destination, calculateBridgeFee, args } = options;
    const message = args[2] || `Received message that written at ${new Date().toLocaleTimeString()}.`;
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

    const feeSource = await calculateBridgeFee(source, destination);
    const feeRemote = await calculateBridgeFee(destination, source);
    const totalFee = BigNumber.from(feeSource).add(feeRemote);

    const tx = await source.contract
        .sendContractCall(destination.name, destination.receiver.address, payload, {
            value: totalFee,
        })
        .then((tx) => tx.wait());
    const event = tx.events.find((event) => event.event === 'ContractCallSent');
    const nonce = event.args.nonce;

    while (!(await source.contract.executed(nonce))) {
        await sleep(2000);
    }

    console.log('--- After ---');
    await print();
}

module.exports = {
    deploy,
    execute,
};
