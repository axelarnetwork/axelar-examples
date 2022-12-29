'use strict';

const {
    getDefaultProvider,
    Contract,
    constants: { AddressZero },
    utils: { defaultAbiCoder },
} = require('ethers');
const { deployUpgradable, deployAndInitContractConstant, predictContractConstant } = require('@axelar-network/axelar-gmp-sdk-solidity');

const ExampleProxy = require('../../artifacts/examples/Proxy.sol/ExampleProxy.json');
const CallSender = require('../../artifacts/examples/nonced-execution/NoncedContractCallSender.sol/NoncedContractCallSender.json');
const Executable = require('../../artifacts/examples/nonced-execution/ExecutableImplementation.sol/ExecutableImplementation.json');

const time = new Date().getTime();

async function deploy(chain, wallet) {
    console.log(`Deploying NoncedContractCallSender for ${chain.name}.`);
    chain.provider = getDefaultProvider(chain.rpc);
    chain.wallet = wallet.connect(chain.provider);

    const executableAddress = await predictContractConstant(
        chain.constAddressDeployer,
        wallet,
        ExampleProxy,
        'call-executable-' + time,
        [],
    );

    chain.sender = await deployAndInitContractConstant(
        chain.constAddressDeployer,
        wallet,
        CallSender,
        'call-sender-' + time,
        [],
        [chain.gateway.address, chain.gasReceiver, executableAddress],
    );
    console.log(`Deployed NoncedContractCallSender for ${chain.name} at ${chain.sender.address}.`);

    console.log(`Deploying ExecutableImplementation for ${chain.name}.`);
    chain.contract = await deployUpgradable(
        chain.constAddressDeployer,
        wallet,
        Executable,
        ExampleProxy,
        [chain.gateway.address],
        [],
        defaultAbiCoder.encode(['address'], [chain.sender.address]),
        'call-executable-' + time,
    );
    if (chain.contract.address.toLowerCase() !== executableAddress.toLowerCase())
        throw new Error(`Not deployed as expected! ${chain.contract.address} was supposed to be ${executableAddress}`);

    console.log(`Deployed ExecutableImplementation for ${chain.name} at ${chain.contract.address}.`);
}

async function test(chains, wallet, options) {
    const args = options.args || [];
    const getGasPrice = options.getGasPrice;

    const source = chains.find((chain) => chain.name === (args[0] || 'Avalanche'));
    const destination = chains.find((chain) => chain.name === (args[1] || 'Fantom'));
    const message = args[2] || `Hello, the time is ${time}.`;
    const payload = defaultAbiCoder.encode(['string'], [message]);
    const expectedNonce = await destination.contract.incomingNonces(source.name, wallet.address);

    async function print() {
        const nonce = await destination.contract.incomingNonces(source.name, wallet.address);
        console.log(
            `Last message sent from ${source.name} @ ${wallet.address} to ${destination.name} was "${
                nonce >= 0 ? await destination.contract.messages(source.name, wallet.address, nonce) : ''
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

    const gasLimit = 3e5;
    const gasPrice = await getGasPrice(source, destination, AddressZero);

    await (await source.sender.sendContractCall(destination.name, payload, { value: BigInt(Math.floor(gasLimit * gasPrice)) })).wait();

    while ((await destination.contract.messages(source.name, wallet.address, expectedNonce)) !== message) {
        await sleep(2000);
    }

    console.log('--- After ---');
    await print();
}

module.exports = {
    deploy,
    test,
};
