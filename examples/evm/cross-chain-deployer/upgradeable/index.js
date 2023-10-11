'use strict';

const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');

const SampleImplementation = rootRequire(
    './artifacts/examples/evm/cross-chain-deployer/upgradeable/SampleImplementation.sol/SampleImplementation.json',
);
const CrossChainDeployer = rootRequire(
    './artifacts/examples/evm/cross-chain-deployer/upgradeable/CrossChainUpgradeableContractDeployer.sol/CrossChainUpgradeableContractDeployer.json',
);
const Create3Deployer = rootRequire(
    './artifacts/@axelar-network/axelar-gmp-sdk-solidity/contracts/deploy/Create3Deployer.sol/Create3Deployer.json',
);
const {
    ContractFactory,
    utils: { keccak256, defaultAbiCoder, id },
} = require('ethers');
const ethers = require('ethers');

const getSaltFromKey = (key) => {
    return keccak256(defaultAbiCoder.encode(['string'], [key.toString()]));
};

async function deploy(chain, wallet) {
    chain.wallet = wallet;

    console.log(`Deploying Create3Deployer for ${chain.name}.`);
    chain.create3Deployer = await deployContract(wallet, Create3Deployer, []);
    console.log(`Deployed Create3Deployer for ${chain.name} at ${chain.create3Deployer.address}.`);

    console.log(`Deploying CrossChainDeployer for ${chain.name}.`);
    chain.crossChainDeployer = await deployContract(wallet, CrossChainDeployer, [
        chain.gateway,
        chain.gasService,
        chain.create3Deployer.address,
    ]);
    console.log(`Deployed CrossChainDeployer for ${chain.name} at ${chain.crossChainDeployer.address}.`);
}

async function execute(chains, wallet, options) {
    const { source, destination, calculateBridgeFee } = options;

    const fee = await calculateBridgeFee(source, destination, {
        gasLimit: 3000000,
        gasMultiplier: 2,
    });

    const factory = new ContractFactory(SampleImplementation.abi, SampleImplementation.bytecode);
    const bytecode = factory.getDeployTransaction(...[]).data;
    const salt = getSaltFromKey('1');

    const calls = {
        destinationChain: destination.name,
        destinationAddress: destination.crossChainDeployer.address,
        gas: fee,
    };
    const setupParams = defaultAbiCoder.encode(['string'], ['0x']);
    const tx = await source.crossChainDeployer.deployRemoteContracts([calls], bytecode, salt, wallet.address, setupParams, {
        value: fee,
    });

    await tx.wait(1);

    const destProvider = new ethers.providers.JsonRpcProvider(destination.rpc);
    const waitForEvent = () =>
        new Promise((resolve, reject) => {
            destProvider.on(
                {
                    address: destination.crossChainDeployer.address,
                    topics: [id('Executed(address,address,address)')],
                },
                (tx) => resolve(tx),
            );
            destProvider.on('error', (tx) => reject(tx));
        });

    const destTx = await waitForEvent();
    const destTxReceipt = await destProvider.getTransactionReceipt(destTx.transactionHash);

    const log = new ethers.utils.Interface([
        'event Executed(address indexed _owner, address indexed _deployedImplementationAddress, address indexed _deployedProxyAddress)',
    ]).parseLog(destTxReceipt.logs[1]);
    console.log(
        `${SampleImplementation.contractName} deployed on ${destination.name} at ${log.args._deployedImplementationAddress} with proxy at ${log.args._deployedProxyAddress} by ${log.args._owner}`,
    );
}

module.exports = {
    deploy,
    execute,
};
