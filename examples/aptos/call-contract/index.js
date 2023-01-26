'use strict';

const { HexString } = require('aptos');
const {
    getDefaultProvider,
    Contract,
    constants: { AddressZero },
} = require('ethers');
const {
    utils: { deployContract },
    AptosNetwork,
} = require('@axelar-network/axelar-local-dev');

const { sleep } = rootRequire('./utils');
const HelloWorld = rootRequire('./artifacts/examples/aptos-call-contract/contracts/HelloWorld.sol/HelloWorld.json');
const { defaultAbiCoder } = require('ethers/lib/utils');

async function preDeploy() {
    console.log(`Deploying HelloWorld for aptos.`);
    const client = new AptosNetwork(process.env.APTOS_URL);
    await client.deploy('examples/aptos-call-contract/modules/build/hello_world', ['hello_world.mv']);
    console.log(`Deployed HelloWorld for aptos.`);
}

async function deploy(chain, wallet) {
    console.log(`Deploying HelloWorld for ${chain.name}.`);
    const contract = await deployContract(wallet, HelloWorld, [chain.gateway, chain.gasReceiver]);
    chain.helloWorld = contract.address;
    console.log(`Deployed HelloWorld for ${chain.name} at ${chain.helloWorld}.`);
}

async function execute(chains, wallet, options) {
    const args = options.args || [];
    const getGasPrice = options.getGasPrice;
    const client = new AptosNetwork(process.env.APTOS_URL);
    for (const chain of chains) {
        const provider = getDefaultProvider(chain.rpc);
        chain.wallet = wallet.connect(provider);
        chain.contract = new Contract(chain.helloWorld, HelloWorld.abi, chain.wallet);
    }

    const evm = chains.find((chain) => chain.name === (args[0] || 'Avalanche'));
    const messageEvmToAptos = args[1] || `Hello aptos from ${evm.name}, it is ${new Date().toLocaleTimeString()}.`;
    const messageAptosToEvm = args[2] || `Hello ${evm.name} from aptos, it is ${new Date().toLocaleTimeString()}.`;

    async function logValue() {
        console.log(`value at ${evm.name} is "${await evm.contract.value()}"`);
        const resources = await client.getAccountResources(client.owner.address());
        const resource = resources.find((r) => r.type == `${client.owner.address()}::hello_world::MessageHolder`);
        const msg = resource.data.message;
        console.log(`value at aptos is "${msg}"`);
    }

    console.log('--- Initially ---');
    await logValue();

    //Set the gasLimit to 3e5 (a safe overestimate) and get the gas price.
    const gasLimit = 3e5;
    const gasPrice = await getGasPrice(evm, 'aptos', AddressZero);

    const tx = await evm.contract.setRemoteValue('aptos', `${client.owner.address()}::hello_world`, messageEvmToAptos, {
        value: BigInt(Math.floor(gasLimit * gasPrice)),
    });
    await tx.wait();
    const payload = new HexString(defaultAbiCoder.encode(['string'], [messageAptosToEvm])).toUint8Array();
    await client.submitTransactionAndWait(client.owner.address(), {
        function: `${client.owner.address()}::hello_world::call`,
        type_arguments: [],
        arguments: [evm.name, evm.helloWorld, payload, gasLimit * gasPrice],
    });

    await sleep(3000);

    console.log('--- After ---');
    await logValue();
}

module.exports = {
    preDeploy,
    deploy,
    execute,
};
