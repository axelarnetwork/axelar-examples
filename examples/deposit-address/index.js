'use strict';

const {
    getDefaultProvider,
    Contract,
    constants: { AddressZero },
} = require('ethers');

const Gateway = require('../../artifacts/@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol/IAxelarGateway.json');
const IERC20 = require('../../artifacts/@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol/IERC20.json');

async function test(chains, wallet, options = {}) {
    const args = options.args || [];
    const getDepositAddress = options.getDepositAddress;
    const source = chains.find((chain) => chain.name === (args[0] || 'Avalanche'));
    const destination = chains.find((chain) => chain.name === (args[1] || 'Fantom'));
    const amount = args[2] || 10e6;
    const destinationAddress = args[3] || wallet.address;
    const symbol = 'aUSDC';

    for (const chain of [source, destination]) {
        const provider = getDefaultProvider(chain.rpc);
        chain.wallet = wallet.connect(provider);
        chain.contract = new Contract(chain.gateway, Gateway.abi, chain.wallet);
        const tokenAddress = await chain.contract.tokenAddresses(symbol);
        chain.token = new Contract(tokenAddress, IERC20.abi, chain.wallet);
    }

    async function print() {
        console.log(`Balance at ${source.name} is ${await source.token.balanceOf(wallet.address)}`);
        console.log(`Balance at ${destination.name} is ${await destination.token.balanceOf(destinationAddress)}`);
    }
    function sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, ms);
        });
    }
    const balance = await destination.token.balanceOf(destinationAddress);
    console.log('--- Initially ---');
    await print();

    const depositAddress = await getDepositAddress(source.name, destination.name, destinationAddress, symbol);
    console.log(depositAddress);
    await (await source.token.transfer(depositAddress, amount)).wait();

    while (true) {
        const newBalance = await destination.token.balanceOf(destinationAddress);
        if (Number(balance) !== Number(newBalance)) break;
        await sleep(2000);
    }

    console.log('--- After ---');
    await print();
}

module.exports = {
    test,
};
