'use strict';

const {
    Contract,
    constants: { AddressZero },
    ContractFactory,
    ethers,
} = require('ethers');
const {
    contracts: { GMPExpressService },
} = require('@axelar-network/axelar-local-dev');
const DistributionExpressExecutable = rootRequire(
    './artifacts/examples/evm/call-contract-with-token-express/DistributionExpressExecutable.sol/DistributionExpressExecutable.json',
);
const IGMPExpressService = require('@axelar-network/axelar-gmp-sdk-solidity/artifacts/contracts/interfaces/IGMPExpressService.sol/IGMPExpressService.json');

async function deploy(chain, wallet) {
    chain.wallet = wallet;

    // Deploy the DistributionExpressExecutable contract
    const gmpExpressService = new Contract(chain.GMPExpressService.address, IGMPExpressService.abi, chain.wallet);

    // Get the salt for the proxy deployment. Salt has to be a unique value for each deployment.
    const salt = ethers.utils.id(Date.now().toString());

    // Get the bytecode for the DistributionExpressExecutable contract
    const factory = new ContractFactory(DistributionExpressExecutable.abi, DistributionExpressExecutable.bytecode);
    const bytecode = factory.getDeployTransaction(chain.gateway, chain.gasService).data;
    console.log(`Deploying DistributionExpressExecutable with Proxy for ${chain.name}.`);

    // Deploy the DistributionExpressExecutable contract with the proxy
    const owner = chain.wallet.address;
    await gmpExpressService.deployExpressExecutable(salt, bytecode, owner, '0x').then((tx) => tx.wait(1));

    // Get the address of the deployed Proxy contract
    const deployedAddress = await gmpExpressService.deployedProxyAddress(salt, owner);
    console.log(`Deployed DistributionExpressExecutable with Proxy for ${chain.name} at`, deployedAddress);

    // Create a contract instance for the deployed contract
    chain.contract = new Contract(deployedAddress, DistributionExpressExecutable.abi, chain.wallet);
}

async function execute(chains, wallet, options) {
    const args = options.args || [];
    const { source, destination, calculateBridgeFee } = options;
    const fee = calculateBridgeFee(source, destination);
    const amount = Math.floor(parseFloat(args[2])) * 1e6 || 10e6;
    const accounts = args.slice(3);

    if (accounts.length === 0) accounts.push(wallet.address);

    const initialBalance = await destination.usdc.balanceOf(accounts[0]);
    const expressService = new Contract(destination.GMPExpressService.address, GMPExpressService.abi, wallet.connect(destination.provider));
    const expressServiceBalance = await destination.usdc.balanceOf(expressService.address);
    console.log('aUSDC Balance for ExpressService', expressServiceBalance.toString());

    async function logAccountBalances() {
        for (const account of accounts) {
            console.log(`${account} has ${(await destination.usdc.balanceOf(account)) / 1e6} aUSDC`);
        }
    }

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    console.log('--- Initially ---');
    await logAccountBalances();

    const approveTx = await source.usdc.approve(source.contract.address, amount);
    await approveTx.wait();
    console.log('Approved aUSDC on', source.name);

    const sendTx = await source.contract.sendToMany(destination.name, destination.contract.address, accounts, 'aUSDC', amount, {
        value: fee,
    });
    await sendTx.wait();
    console.log('Sent tokens to distribution contract.', sendTx.hash);


    while ((await destination.usdc.balanceOf(accounts[0])).eq(initialBalance)) {
      await sleep(1000);
    }

    console.log('--- After ---');
    await logAccountBalances();
}

module.exports = {
    deploy,
    execute,
};
