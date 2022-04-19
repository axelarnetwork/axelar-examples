const { createNetwork, listen, relay, utils: { setJSON } } = require('@axelar-network/axelar-local-dev');
const { Wallet, utils: {keccak256, defaultAbiCoder} } = require('ethers');
const fs = require('fs');

const chains = require('./testnet.json');
(async () => { 
    const user_key = keccak256(defaultAbiCoder.encode(['string'], ['A random string to make an account']));
    const user_address = new Wallet(user_key).address;
    const deployer_key = keccak256(defaultAbiCoder.encode(['string'], ['this is a random string to get a random account. You need to provide the private key for a funded account here.']));
    const deployer_address = new Wallet(deployer_key).address;
    const chains_local = {};
    let i = 0;
    for(const name in chains) {
        const chain = await createNetwork({name: name, seed: name});
        chains_local[name] = {};
        chains_local[name].rpc = `http://localhost:8500/${i}`;
        chains_local[name].gateway = chain.gateway.address;
        chains_local[name].gasReceiver = chain.gasReceiver.address;
        const [user] = chain.userWallets;
        await (await user.sendTransaction({
            to: user_address,
            value: BigInt(100e18),
        })).wait();
        await (await user.sendTransaction({
            to: deployer_address,
            value: BigInt(100e18),
        })).wait();
        i++;
    }
    listen(8500);
    setInterval(async () => {
        await relay();
    }, 2000);
    setJSON(chains_local, './examples/testnet/local.json');

    process.on('SIGINT', function() {
        fs.unlinkSync(`./examples/testnet/local.json`);
        process.exit();
    });
})();