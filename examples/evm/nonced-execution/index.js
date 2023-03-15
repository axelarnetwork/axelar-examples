'use strict';

const {
    utils: { defaultAbiCoder },
} = require('ethers');
const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');

// const ExampleProxy = rootRequire('./artifacts/examples/evm/Proxy.sol/ExampleProxy.json');
// const CallSender = rootRequire('./artifacts/examples/evm/nonced-execution/NoncedContractCallSender.sol/NoncedContractCallSender.json');
const Executable = rootRequire('./artifacts/examples/evm/nonced-execution/ExecutableImplementation.sol/ExecutableImplementation.json');

const time = new Date().getTime();

async function deploy(chain, wallet) {
    // console.log(`Deploying NoncedContractCallSender for ${chain.name}.`);
    chain.wallet = wallet;

    // const executableAddress = await predictContractConstant(
    //     chain.constAddressDeployer,
    //     wallet,
    //     ExampleProxy,
    //     `call-executable-${time}`,
    //     [],
    // );

    // chain.sender = await deployAndInitContractConstant(
    //     chain.constAddressDeployer,
    //     wallet,
    //     CallSender,
    //     `call-sender-${time}`,
    //     [],
    //     [chain.gateway, chain.gasService, executableAddress],
    // );
    // console.log(`Deployed NoncedContractCallSender for ${chain.name} at ${chain.sender.address}.`);

    console.log(`Deploying ExecutableImplementation for ${chain.name}.`);
    chain.contract = await deployContract(wallet, Executable, [chain.gateway, chain.gasService]);
    console.log(`Deployed ExecutableImplementation for ${chain.name} at ${chain.contract.address}.`);
}

async function execute(chains, wallet, options) {
    const args = options.args || [];
    const calculateBridgeFee = options.calculateBridgeFee;

    const source = chains.find((chain) => chain.name === (args[0] || 'Avalanche'));
    const destination = chains.find((chain) => chain.name === (args[1] || 'Fantom'));
    const message = args[2] || `Hello, the time is ${time}.`;
    const payload = defaultAbiCoder.encode(['string'], [message]);
    const expectedNonce = await destination.contract.incomingNonces(source.name, source.contract.address);

    async function print() {
        const nonce = await destination.contract.incomingNonces(source.name, source.contract.address);
        console.log(
            `Last message sent from ${source.name} @ ${source.contract.address} to ${destination.name} was "${
                nonce >= 0 ? await destination.contract.messages(source.name, source.contract.address, nonce) : ''
            }" with a nonce of ${nonce}.`,
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

    const fee = await calculateBridgeFee(source, destination);

    await (await source.contract.sendContractCall(destination.name, destination.contract.address, payload, { value: fee })).wait();

    console.log('--- Waiting for message to be received ---');

    while ((await destination.contract.messages(source.name, source.contract.address, expectedNonce)) !== message) {
        const nonce = await destination.contract.incomingNonces(source.name, source.contract.address);
        console.log('nonce', nonce);
        console.log('destination', await destination.contract.messages(source.name, source.contract.address, expectedNonce));
        console.log('source', message);
        await sleep(2000);
    }

    console.log('--- After ---');
    await print();
}

module.exports = {
    deploy,
    execute,
};
