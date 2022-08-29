'use strict';

const {
    getDefaultProvider,
    Contract,
    constants: { AddressZero },
    utils: { defaultAbiCoder },
} = require('ethers');
const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');

const SendAckReceiver = require('../../artifacts/examples/send-ack/SendAckReceiverImplementation.sol/SendAckReceiverImplementation.json');
const SendAckSender = require('../../artifacts/examples/send-ack/SendAckSender.sol/SendAckSender.json');

const time = new Date().getTime();

async function deploy(chain, wallet) {
    console.log(`Deploying SendAckSender for ${chain.name}.`);
    const sender = await deployContract(wallet, SendAckSender, [chain.gateway, chain.gasReceiver, chain.name]);
    chain.sendAckSender = sender.address;
    console.log(`Deployed SendAckSender for ${chain.name} at ${chain.sendAckSender}.`);

    console.log(`Deploying SendAckReceiverImplementation for ${chain.name}.`);
    const receiver = await deployContract(wallet, SendAckReceiver, [chain.gateway]);
    chain.sendAckReceiver = receiver.address;
    console.log(`Deployed SendAckReceiverImplementation for ${chain.name} at ${chain.sendAckReceiver}.`);
}

async function test(chains, wallet, options) {
    const args = options.args || [];
    const getGasPrice = options.getGasPrice;
    for (const chain of chains) {
        chain.provider = getDefaultProvider(chain.rpc);
        chain.wallet = wallet.connect(chain.provider);
        chain.sender = new Contract(chain.sendAckSender, SendAckSender.abi, chain.wallet);
        chain.receiver = new Contract(chain.sendAckReceiver, SendAckReceiver.abi, chain.wallet);
    }
    const source = chains.find((chain) => chain.name === (args[0] || 'Avalanche'));
    const destination = chains.find((chain) => chain.name === (args[1] || 'Fantom'));
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
    function sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, ms);
        });
    }
    console.log('--- Initially ---');
    await print();

    const gasLimitRemote = 3e5;
    const gasLimitSource = 3e5;
    const gasPriceRemote = await getGasPrice(source, destination, AddressZero);
    const gasPriceSource = await getGasPrice(source, source, AddressZero);
    const gasAmountRemote = BigInt(Math.floor(gasLimitRemote * gasPriceRemote));
    const gasAmountSource = BigInt(Math.floor(gasLimitSource * gasPriceSource));

    const tx = await (
        await source.sender.sendContractCall(destination.name, destination.receiver.address, payload, gasAmountRemote, {
            value: gasAmountRemote + gasAmountSource,
        })
    ).wait();
    const event = tx.events.find((event) => event.event == 'ContractCallSent');
    const nonce = event.args.nonce;

    while (!(await source.sender.executed(nonce))) {
        await sleep(2000);
    }

    console.log('--- After ---');
    await print();
}

module.exports = {
    deploy,
    test,
};
