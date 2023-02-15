'use strict';

const {
    getDefaultProvider,
    Contract,
    constants: { AddressZero },
    ethers,
    utils: { keccak256, defaultAbiCoder },
    ContractFactory,
} = require('ethers');
const { deployUpgradable } = require('@axelar-network/axelar-gmp-sdk-solidity');
const DistributionExecutable = rootRequire(
    './artifacts/examples/evm/call-contract-with-token-express/DistributionExpressExecutable.sol/DistributionExpressExecutable.json',
);
const ExpressProxy = require('@axelar-network/axelar-gmp-sdk-solidity/artifacts/contracts/express/ExpressProxy.sol/ExpressProxy.json');
const Gateway = rootRequire(
    './artifacts/@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol/IAxelarGateway.json',
);
const IERC20 = rootRequire('./artifacts/@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol/IERC20.json');
const IGMPExpressService = require('@axelar-network/axelar-gmp-sdk-solidity/artifacts/contracts/interfaces/IGMPExpressService.sol/IGMPExpressService.json');

async function deployOld(chain, wallet) {
    console.log(`Deploying DistributionExecutable for ${chain.name}.`);
    const provider = getDefaultProvider(chain.rpc);
    chain.wallet = wallet.connect(provider);
    console.log(`Deploying DistributionProxy for ${chain.name}.`);
    chain.contract = await deployUpgradable(
        chain.constAddressDeployer,
        wallet,
        DistributionExecutable,
        ExpressProxy,
        [chain.gateway, chain.gasService],
        [chain.gateway, '0xfb72239394647e97894585D0D93Ca91f6C3852a4'],
        '0x',
    );
    console.log(`Deployed DistributionProxy for ${chain.name} at ${chain.contract.address}.`);
    const gateway = new Contract(chain.gateway, Gateway.abi, chain.wallet);
    const usdcAddress = await gateway.tokenAddresses('aUSDC');
    chain.usdc = new Contract(usdcAddress, IERC20.abi, chain.wallet);
    chain.proxy = new Contract(chain.contract.address, ExpressProxy.abi, chain.wallet);
    await chain.proxy.deployRegistry();
    console.log(`Deployed Registry for ${chain.name} at ${await chain.proxy.registry()}.`);
}

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
    console.log('Deployed proxy for DistributionExecutable at', deployedAddress);
    chain.contract = new Contract(
        deployedAddress,
        [
            ...DistributionExecutable.abi,
            'function expressExecuteWithToken(string sourceChain,address sourceAddress,bytes payload,string symbol,uint256 amount)',
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

    // // express call
    const payload = ethers.utils.defaultAbiCoder.encode(['address[]'], [accounts]);

    const approveDestTx = await destination.usdc.approve(destination.contract.address, amount);
    await approveDestTx.wait();
    console.log('expressExecuteWithToken...');
    await destination.contract.expressExecuteWithToken(source.name, source.contract.address, payload, 'aUSDC', amount);

    console.log('--- After ---');
    await logAccountBalances();
}

module.exports = {
    deploy,
    execute,
};
