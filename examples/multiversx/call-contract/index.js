'use strict';

const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');
const { loadMultiversXNetwork, updateMultiversXConfig } = require('@axelar-network/axelar-local-dev-multiversx');

const HelloWorld = rootRequire('./artifacts/examples/multiversx/call-contract/contracts/HelloWorld.sol/HelloWorld.json');

const path = require('path');
const { AddressValue, ContractFunction, Address, SmartContract, StringValue, ResultsParser, BinaryCodec, TupleType,
    StringType, BytesType, BytesValue
} = require('@multiversx/sdk-core/out');
const { defaultAbiCoder } = require('ethers/lib/utils');

async function preDeploy() {
    console.log(`Deploying HelloWorld for MultiversX.`);
    const client = await loadMultiversXNetwork();

    const contractCode = path.join(__dirname, 'hello-world/output/hello-world.wasm')

    const contractAddress = await client.deployContract(contractCode, [
        new AddressValue(client.gatewayAddress),
        new AddressValue(client.gasReceiverAddress),
    ]);
    console.log(`Deployed HelloWorld for MultiversX at ${contractAddress}.`);

    updateMultiversXConfig(contractAddress);
}

async function deploy(chain, wallet) {
    console.log(`Deploying HelloWorld for ${chain.name}.`);
    chain.contract = await deployContract(wallet, HelloWorld, [chain.gateway, chain.gasService]);
    console.log(`Deployed HelloWorld for ${chain.name} at ${chain.contract.address}.`);
}

async function execute(destination, wallet, options) {
    const args = options.args || [];

    const client = await loadMultiversXNetwork();

    const contractAddress = client?.contractAddress;

    if (!contractAddress) {
        throw new Error('Deploy MultiversX contract before running this!')
    }

    async function logValue() {
        console.log(`Value at ${destination.name} is "${await destination.contract.value()}"`);

        const result = await client.callContract(contractAddress, "received_value");

        const parsedResult = new ResultsParser().parseUntypedQueryResponse(result);

        if (parsedResult?.values?.[0]) {
            const decoded = new BinaryCodec().decodeTopLevel(
                parsedResult.values[0],
                new TupleType(new StringType(), new StringType(), new BytesType())
            ).valueOf();
            const sourceChain = decoded.field0;
            const sourceAddress = decoded.field1;
            const payload = decoded.field2;

            console.log(`Value at MultiversX is "${sourceChain}", "${sourceAddress}" - ${payload}`);
        } else {
            console.log(`Value at MultiversX is ""`);
        }
    }

    console.log('--- Initially ---');
    await logValue();

    // Currently, the SDK can't calculate bridge fee for MultiversX, so we just use a fixed value.
    const crossChainGasLimit = 100_000_000;

    await executeMultiversXToEvm(contractAddress, client, destination, crossChainGasLimit, args?.[1]);

    await executeEvmToMultiversX(contractAddress, client, destination, crossChainGasLimit, args?.[2]);

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    await sleep(15000);

    console.log('--- After ---');
    await logValue();
}

async function executeMultiversXToEvm(contractAddress, client, destination, crossChainGasLimit, optMessage) {
    const message = optMessage || `Hello ${destination.name} from MultiversX, it is ${new Date().toLocaleTimeString()}.`;

    // Remove '0x' from beginning of hex strings encoded by Ethereum
    const messageEvm = defaultAbiCoder.encode(['string'], [message]).substring(2);
    const contract = new SmartContract({ address: Address.fromBech32(contractAddress) });
    const transaction = contract.call({
        caller: client.owner,
        func: new ContractFunction('setRemoteValue'),
        gasLimit: 20_000_000,
        args: [
            new StringValue(destination.name),
            new StringValue(destination.contract.address),
            new BytesValue(Buffer.from(messageEvm, 'hex'))
        ],
        value: crossChainGasLimit,
        chainID: 'localnet'
    });
    transaction.setNonce(client.ownerAccount.getNonceThenIncrement());

    const returnCode = await client.signAndSendTransaction(transaction);
    const hash = transaction.getHash();

    if (!returnCode.isSuccess()) {
        throw new Error(`Could not call MultiversX contract setRemoteValue... ${hash}`);
    }
}

async function executeEvmToMultiversX(contractAddress, client, destination, crossChainGasLimit, optMessage) {
    const message = optMessage || `Hello MultiversX from ${destination.name}, it is ${new Date().toLocaleTimeString()}.`;

    const tx = await destination.contract.setRemoteValue('multiversx', contractAddress, message, {
        value: BigInt(crossChainGasLimit),
    });
    await tx.wait();
}

module.exports = {
    preDeploy,
    deploy,
    execute,
};
