const {createNetwork, setupNetwork, utils: { defaultAccounts }} = require('@axelar-network/axelar-local-dev');


(async () => {
    // Create an Axelar network and serve it at port 8501.
    const chain1 = await createNetwork({
        port: 8511,
    });
    // Give the first user 10000 UST.
    const [user1] = chain1.userWallets;
    await chain1.giveToken(user1.address, 'UST', 100e6);

    // Create a network and serve it at port 8502. This network will not have a gateway deployed.
    const accounts = defaultAccounts(20);
    const blank = require('ganache').server({
        wallet: { accounts: accounts },
        chain: {
            chainId: 3000,
            netwrokId: 3000,
        },
        logging: { quiet: true },
    });
    blank.listen(8512, err => {
        if (err)
            throw err;
        console.log(`Serving an unitiated blockchain on 8512.`);
    });

    const chain2 = await setupNetwork('http://localhost:8512', {
        name: 'Chain2',
        ownerKey: accounts[0].secretKey,
        userKeys: accounts.splice(1, 10).map(acc => acc.secretKey),
    });
    // This info is to be used when connecting to the network.
    console.log('');
    console.log(`Use the info below to connect to ${chain2.name}:`);
    console.log(chain2.getInfo());
})();