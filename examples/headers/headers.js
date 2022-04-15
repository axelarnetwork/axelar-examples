const {createNetwork, networks, relay, getGasPrice, utils: { deployContract }} = require('@axelar-network/axelar-local-dev');
const Headers = require('../../build/Headers.json');

( async () => {
    //The number of chains to all share their headers.
    const n = 5;

    //Setup
    for(let i=0;i<n;i++) {
        const chain = await createNetwork({seed: i.toString()});
        const [user] = chain.userWallets;
        chain.headers = await deployContract(user, Headers, [chain.gateway.address, chain.gasReceiver.address, 10]);
    }

    //Introduce siblings and send headers.
    for(let i=0;i<n;i++) {
        const chain = networks[i];
        const [user] = chain.userWallets;
        const chains = [];
        const gases = [];
        for(let j=0;j<n;j++) {
            if(i==j) continue;
            await (await chain.headers.connect(user).addSibling(networks[j].name, networks[j].headers.address)).wait();
            chains.push(networks[j].name);
            const gasLimit = 1e6;
            const gasPrice = getGasPrice(chain, networks[j], chain.ust.address);
            gases.push(gasPrice * gasLimit);
        }
        //Total gas to be payed.
        let totalGas = gases.reduce((partialSum, a) => partialSum + a, 0);;
        await chain.giveToken(user.address, 'UST', totalGas);
        await (await chain.ust.connect(user).approve(chain.headers.address, totalGas)).wait();
        await (await chain.headers.connect(user).updateRemoteHeaders(chain.ust.address, chains, gases)).wait();
    }
    await relay();

    //Print the last saved header for each chain, and the actualt header of that chain to ensure they match.
    for(let i=0;i<n;i++) {
        const chain = networks[i];
        console.log(`---- ${chain.name} -----`);
        for(let j=0;j<n;j++) {
            if(i==j) continue;
            const l = Number(await chain.headers.getStoredLength(networks[j].name));
            if(l == 0) continue;
            const [lastBlock, lastHeader] = await chain.headers.getHeader(networks[j].name, 0);
            console.log(`${networks[j].name}: ${lastHeader} at ${lastBlock}`);
            //Use below to verify that the correct headers were relayed.
            //const block = await networks[j].provider.getBlock(Number(lastBlock));
            //console.log(block.hash);
        }
    }
})();