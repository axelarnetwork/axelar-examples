const { createNetwork, relay, utils: { setJSON } } = require('@axelar-network/axelar-local-dev');

(async () => {
    // Create an Axelar network and serve it at port 8501
    const chain1 = await createNetwork({
        port: 8501,
        seed: '1',
    });

    const chain2 = await createNetwork({
        port: 8502,
        seed: '2',
    });

    setJSON(chain1.getInfo(), './chain1.json');
    setJSON(chain2.getInfo(), './chain2.json');

    let lock = false
    setInterval(async () => {
        if (lock) return;
        lock = true;
        await relay();
        lock = false;
    }, 1000);


    const args = process.argv.slice(2);
    if (args && args.length === 0) return;
    const address = args[0];
    console.log(`Giving 1 ETH and 1000 UST to ${address} on both Chains...`);
    const [user1] = chain1.userWallets;
    await (await user1.sendTransaction({
        to: address,
        value: BigInt(1e18),
    })).wait();
    await chain1.giveToken(address, 'UST', 1e9);
    const [user2] = chain2.userWallets;
    await (await user2.sendTransaction({
        to: address,
        value: BigInt(1e18),
    })).wait();
    await chain2.giveToken(address, 'UST', 1e9);

    console.log('Done!');
})();