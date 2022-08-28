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
    const executableAddress = await predictContractConstant(
        chain.constAddressDeployer,
        wallet,
        ExampleProxy,
        'call-executable-' + time,
        [],
    );

    const sender = await deployAndInitContractConstant(
        chain.constAddressDeployer,
        wallet,
        CallSender,
        'call-sender-' + time,
        [],
        [chain.gateway, chain.gasReceiver, executableAddress],
    );
    chain.noncedSender = sender.address;
    console.log(`Deployed NoncedContractCallSender for ${chain.name} at ${chain.noncedSender}.`);

    console.log(`Deploying ExecutableImplementation for ${chain.name}.`);
    const executable = await deployUpgradable(
        chain.constAddressDeployer,
        wallet,
        Executable,
        ExampleProxy,
        [chain.gateway],
        [],
        defaultAbiCoder.encode(['address'], [sender.address]),
        'call-executable-' + time,
    );
    if (executable.address.toLowerCase() !== executableAddress.toLowerCase())
        throw new Error(`Not deployed as expected! ${executable.address} was supposed to be ${executableAddress}`);

    chain.noncedExecutable = executable.address;
    console.log(`Deployed ExecutableImplementation for ${chain.name} at ${chain.noncedExecutable}.`);
}

async function test(chains, wallet, options) {
    const args = options.args || [];
    const getGasPrice = options.getGasPrice;
    for (const chain of chains) {
        chain.provider = getDefaultProvider(chain.rpc);
        chain.wallet = wallet.connect(chain.provider);
        chain.sender = new Contract(chain.noncedSender, CallSender.abi, chain.wallet);
        chain.executable = new Contract(chain.noncedExecutable, Executable.abi, chain.wallet);
    }
    const source = chains.find((chain) => chain.name === (args[0] || 'Avalanche'));
    const destination = chains.find((chain) => chain.name === (args[1] || 'Fantom'));
    const message = args[2] || `Hello, the time is ${time}.`;
    const payload = defaultAbiCoder.encode(['string'], [message]);
    const expectedNonce = await destination.executable.incomingNonces(source.name, wallet.address);

    async function print() {
        const nonce = await destination.executable.incomingNonces(source.name, wallet.address);
        console.log(
            `Last message sent from ${source.name} @ ${wallet.address} to ${destination.name} was "${
                nonce >= 0 ? await destination.executable.messages(source.name, wallet.address, nonce) : ''
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

    while ((await destination.executable.messages(source.name, wallet.address, expectedNonce)) !== message) {
        await sleep(2000);
    }

    console.log('--- After ---');
    await print();
}

module.exports = {
    deploy,
    test,
};
