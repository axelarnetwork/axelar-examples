const { createAndExport, utils: { setJSON, deployContract } } = require('@axelar-network/axelar-local-dev');
const { Wallet, utils: {keccak256, defaultAbiCoder} } = require('ethers');



const WETH = require('../build/WETH9.json');
const wethInfo = require('../info/testnetWETH.json');



(async () => {
    const deployer_key = keccak256(defaultAbiCoder.encode(['string'], ['this is a random string to get a random account. You need to provide the private key for a funded account here.']));
    const deployer_address = new Wallet(deployer_key).address;
    const weth_addresses = {};

    async function callback(chain, info) {
        const name = chain.name;
        console.log(name);
        const [user] = chain.userWallets;
        const weth = await deployContract(user, WETH, [wethInfo[name].name, wethInfo[name].symbol]);
        weth_addresses[name] = {
            address: weth.address,
            name: wethInfo[name].name,
            symbol: wethInfo[name].symbol,
        }
        await chain.giveToken(deployer_address, 'UST', 100e6);
    }

    const toFund = [deployer_address]

    for(let j=2; j<process.argv.length; j++) {
        toFund.push(process.argv[j]);
    }

    await createAndExport({
        chainOutputPath: "./info/local.json",
        accountsToFund: toFund,
        callback: callback
    });

    setJSON(weth_addresses, './info/localWETH.json');

})();