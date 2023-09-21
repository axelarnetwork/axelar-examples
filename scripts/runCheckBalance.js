'use strict';

const { ethers } = require('ethers');
const { getWallet, getBalances, getEVMChains, checkEnv } = require('./libs');
const { testnetInfo } = require('@axelar-network/axelar-local-dev');
const {
    contracts: { BurnableMintableCappedERC20, AxelarGateway },
} = require('@axelar-network/axelar-local-dev');

// Get the environment from the command line. If it is not provided, use 'testnet'.
const env = process.argv[2] || 'testnet';

// Check the environment. If it is not valid, exit.
checkEnv(env);

// Get the chains for the environment.
const allTestnetChains = Object.entries(testnetInfo).map((_, chain) => chain.name);
const chains = getEVMChains(env, allTestnetChains);

// Get the wallet.
const wallet = getWallet();

// Print the balances. This will print the balances of the wallet on each chain.
console.log(`==== Print balances for ${env} =====`);
console.log('Wallet address:', wallet.address, '\n');

async function print() {
    console.log('Native tokens:');
    await getBalances(chains, wallet.address).then((balances) => {
        for (let i = 0; i < chains.length; i++) {
            console.log(`${chains[i].name}: ${ethers.utils.formatEther(balances[chains[i].name])} ${chains[i].tokenSymbol}`);
        }
    });

    console.log('\naUSDC tokens:');

    const pendingBalances = chains.map((chain) => {
        const provider = new ethers.providers.JsonRpcProvider(chain.rpc);
        const gateway = new ethers.Contract(chain.gateway, AxelarGateway.abi, provider);
        return gateway
            .tokenAddresses('aUSDC')
            .then((usdc) => {
                const erc20 = new ethers.Contract(usdc, BurnableMintableCappedERC20.abi, provider);
                return erc20.balanceOf(wallet.address).catch(() => '0');
            })
            .then((balance) => {
                console.log(`${chain.name}: ${ethers.utils.formatUnits(balance, 6)} aUSDC`);
            });
    });

    await Promise.all(pendingBalances);
}

print();
