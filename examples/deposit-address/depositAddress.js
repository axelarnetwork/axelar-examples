'use strict';

const {createNetwork: createChain, relay, getDepositAddress} = require('@axelar-network/axelar-local-dev');

const ExecutableSample = require('../../build/ExecutableSample.json');

(async () => {
    // Create two chains and get a funded user for each
    const chain1 = await createChain({ seed: "chain1" });
    const [user1] = chain1.userWallets;
    const chain2 = await createChain({ seed: "chain2" });
    const [user2] = chain2.userWallets;


    // Get some UST on chain1.
    await chain1.giveToken(user1.address, 'UST', 10000000);

    // This is used for logging.
    const print = async () => {
        console.log(`user1 has ${await chain1.ust.balanceOf(user1.address)} UST.`);
        console.log(`user2 has ${await chain2.ust.balanceOf(user2.address)} UST.`);
    }

    console.log('--- Initially ---');
    await print();

    const address = getDepositAddress(chain1, chain2, user2.address, 'UST');
    await (await chain1.ust.connect(user1).transfer(address, 5000000)).wait();
    await relay();
    console.log('--- After Using a Deposit Address to Transfer Token ---');
    await print();

})();