'use strict';

const { ethers } = require('ethers');
const { getBalances, getEVMChains } = require('./libs');
const testnetChains = require('@axelar-network/axelar-cgp-solidity/info/testnet.json');

const {
    contracts: { BurnableMintableCappedERC20, AxelarGateway },
} = require('@axelar-network/axelar-local-dev');

const main = async () => {
    const argv = require('yargs')
        .usage('Usage: yarn run-script myScript --addresses=address1,address2,... [--env=<environment>]')
        .option('env', {
            describe: 'Environment (local or testnet)',
            default: 'local',
            choices: ['local', 'testnet'],
        })
        .option('addresses', {
            describe: 'Comma-separated addresses',
            demandOption: true,
            string: true,
        }).argv;

    const addresses = argv.addresses;
    const env = argv.env;

    // Process the addresses
    if (!addresses) {
        console.log('No addresses provided.');
        process.exit(1);
    }

    const addressList = addresses.split(',');

    const allTestnetChains = testnetChains.map((chain) => chain.name);
    const chains = getEVMChains(env, allTestnetChains);

    async function printBalances(address) {
        // Print the balances. This will print the balances of the wallet on each chain.
        console.log(`==== Print balances for ${env} =====`);
        console.log('Wallet address:', address, '\n');

        console.log('Native tokens:');
        await getBalances(chains, address).then((balances) => {
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
                    return erc20.balanceOf(address).catch(() => '0');
                })
                .then((balance) => {
                    console.log(`${chain.name}: ${ethers.utils.formatUnits(balance, 6)} aUSDC`);
                });
        });

        await Promise.all(pendingBalances);
    }

    for (let address of addressList) {
        console.log('address', address);
        await printBalances(address);
    }
};

main().catch((error) => {
    console.error('An error occurred:', error);
});
