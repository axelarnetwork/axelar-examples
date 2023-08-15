'use strict';

const { getDefaultProvider, Contract, utils } = require('ethers');

const Gateway = rootRequire(
    './artifacts/@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol/IAxelarGateway.json',
);
const IERC20 = rootRequire('./artifacts/@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol/IERC20.json');

async function execute(chains, wallet, options = {}) {
    const args = options.args || [];
    const { source, destination, getDepositAddress } = options;
    const amount = args[2] || 10e14;
    const destinationAddress = args[3] || wallet.address;
    const symbol = 'aUSDC';

    for (const chain of [source, destination]) {
        const provider = getDefaultProvider(chain.rpc);
        chain.wallet = wallet.connect(provider);
        chain.contract = new Contract(chain.gateway.address, Gateway.abi, chain.wallet);
        const tokenAddress = await chain.contract.tokenAddresses(symbol);
        chain.token = new Contract(tokenAddress, IERC20.abi, chain.wallet);
    }

    async function print() {
        const sourceBalance = utils.formatEther(await source.token.balanceOf(wallet.address))
        const destBalance = utils.formatEther(await destination.token.balanceOf(destinationAddress))

        console.log(`Balance at ${source.name} is ${Number(sourceBalance).toFixed(3)}`);        
        console.log(`Balance at ${destination.name} is ${Number(destBalance).toFixed(3)}`);
    }

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const balance = await destination.token.balanceOf(destinationAddress);
    console.log('--- Initially ---');
    await print();

    const depositAddress = await getDepositAddress(source.name, destination.name, destinationAddress, symbol);
    await (await source.token.transfer(depositAddress, amount)).wait();

    while (true) {
        const newBalance = await destination.token.balanceOf(destinationAddress);
        if (Number(balance) !== Number(newBalance)) break;
        await sleep(1000);
    }

    console.log('--- After ---');
    await print();
}

module.exports = {
    execute,
};
