'use strict';

const {createNetwork: createChain, relay} = require('@axelar-network/axelar-local-dev');

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

    // Approve the AxelarGateway to use our UST on chain1.
    await (await chain1.ust.connect(user1).approve(chain1.gateway.address, 5000000)).wait();
    // And have it send it to chain2.
    await (await chain1.gateway.connect(user1).sendToken(chain2.name, user2.address, 'UST', 5000000)).wait();
    // This facilitates the send.
    await relay();
    // After which the funds have reached chain2
    console.log('--- After Sending Token ---');
    await print();
})();