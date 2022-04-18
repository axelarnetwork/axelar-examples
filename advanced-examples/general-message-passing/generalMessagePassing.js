'use strict';

const { createNetwork: createChain, relay, getGasPrice, utils: { deployContract} } = require('@axelar-network/axelar-local-dev');
const { constants: {AddressZero} } = require('ethers');

const ExecutableSample = require('../../build/ExecutableSample.json');

(async () => {
    // Create two chains and get a funded user for each
    const chain1 = await createChain({ seed: "chain1" });
    const [user1] = chain1.userWallets;
    const chain2 = await createChain({ seed: "chain2" });
    const [user2] = chain2.userWallets;

    // Deploy our IAxelarExecutable contracts
    const ex1 = await deployContract(user1, ExecutableSample, [chain1.gateway.address, chain1.gasReceiver.address]);
    const ex2 = await deployContract(user2, ExecutableSample, [chain2.gateway.address, chain2.gasReceiver.address]);

    // Inform our exeuctables about each other.
    await (await ex1.connect(user1).addSibling(chain2.name, ex2.address)).wait();
    await (await ex2.connect(user2).addSibling(chain1.name, ex1.address)).wait();

    // This is used for logging.
    const print = async () => {
        console.log(`ex1: ${await ex1.value()}`);
        console.log(`ex2: ${await ex2.value()}`);
    }

    console.log('--- Initially ---');
    await print();

    //Set the gasLimit to 1e6 (a safe overestimate) and get the gas price (this is constant and always 1).
    const gasLimit = 1e6;
    const gasPrice = getGasPrice(chain1, chain2, AddressZero);
    // Set the value on chain1. This will also cause the value on chain2 to change after relay() is called.
    await (await ex1.connect(user1).set(
        chain2.name, 
        'Hello World!', 
        {value: gasLimit * gasPrice}
    )).wait();

    console.log('--- After Setting but Before Relaying ---');
    await print();
    // Updates the value on chain2 also.
    await relay();
    console.log('--- After Setting and Relaying ---');
    await print();
})();