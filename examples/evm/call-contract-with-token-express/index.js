'use strict';

const {
    getDefaultProvider,
    Contract,
    constants: { AddressZero },
    utils: { keccak256, defaultAbiCoder },
    ContractFactory,
} = require('ethers');
const {
    contracts: { GMPExpressService },
} = require('@axelar-network/axelar-local-dev');
const DistributionExecutable = rootRequire(
    './artifacts/examples/evm/call-contract-with-token-express/DistributionExpressExecutable.sol/DistributionExpressExecutable.json',
);
const IGMPExpressService = require('@axelar-network/axelar-gmp-sdk-solidity/artifacts/contracts/interfaces/IGMPExpressService.sol/IGMPExpressService.json');

const getSaltFromKey = (key) => {
    return keccak256(defaultAbiCoder.encode(['string'], [key.toString()]));
};

async function deploy(chain, wallet) {
    const provider = getDefaultProvider(chain.rpc);
    chain.wallet = wallet.connect(provider);
    const gmpExpressServiceDeployedAddress = chain.GMPExpressService.address;
    const gmpExpressService = new Contract(gmpExpressServiceDeployedAddress, IGMPExpressService.abi, chain.wallet);
    const salt = getSaltFromKey(Date.now());
    const factory = new ContractFactory(DistributionExecutable.abi, DistributionExecutable.bytecode);
    const args = [chain.gateway, chain.gasService];
    const bytecode = factory.getDeployTransaction(...args).data;
    const owner = chain.wallet.address;
    const setupParams = '0x';
    console.log(`Deploying DistributionExecutable for ${chain.name}.`);
    const tx = await gmpExpressService.deployExpressExecutable(salt, bytecode, owner, setupParams);
    await tx.wait(1);
    console.log(`Deploying DistributionProxy for ${chain.name}.`);
    const deployedAddress = await gmpExpressService.deployedProxyAddress(salt, owner);
    console.log(`Deployed DistributionProxy for ${chain.name} at`, deployedAddress);
    chain.contract = new Contract(
        deployedAddress,
        [
            ...DistributionExecutable.abi,
            'function expressExecuteWithToken(string calldata sourceChain,string calldata sourceAddress,bytes calldata payload,string calldata symbol,uint256 amount)',
            'function registry() external view returns (address)',
        ],
        chain.wallet,
    );
}

async function execute(chains, wallet, options) {
    const args = options.args || [];
    const getGasPrice = options.getGasPrice;
    const source = chains.find((chain) => chain.name === (args[0] || 'Avalanche'));
    const destination = chains.find((chain) => chain.name === (args[1] || 'Fantom'));
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

    const gasLimit = 3e6;
    const gasPrice = await getGasPrice(source, destination, AddressZero);

    const approveTx = await source.usdc.approve(source.contract.address, amount);
    await approveTx.wait();
    console.log('Approved aUSDC on', source.name);

    const sendTx = await source.contract.sendToMany(destination.name, destination.contract.address, accounts, 'aUSDC', amount, {
        value: BigInt(Math.floor(gasLimit * gasPrice)),
    });
    await sendTx.wait();
    console.log('Sent tokens to distribution contract.', sendTx.hash);

    console.log('--- After ---');

    while ((await destination.usdc.balanceOf(accounts[0])).eq(initialBalance)) {
        await sleep(1000);
    }

    await logAccountBalances();
}

module.exports = {
    deploy,
    execute,
};
