'use strict';

const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');

const SampleContract = rootRequire('./artifacts/examples/evm/cross-chain-deployer/SampleContract.sol/SampleContract.json');
const CrossChainDeployer = rootRequire('./artifacts/examples/evm/cross-chain-deployer/CrossChainDeployer.sol/CrossChainDeployer.json');
const Create3Deployer = rootRequire(
    './artifacts/@axelar-network/axelar-gmp-sdk-solidity/contracts/deploy/Create3Deployer.sol/Create3Deployer.json',
);
const {
    ContractFactory,
    utils: { keccak256, defaultAbiCoder },
} = require('ethers');

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

    const fee = await calculateBridgeFee(source, destination);

    const factory = new ContractFactory(SampleContract.abi, SampleContract.bytecode);
    const bytecode = factory.getDeployTransaction(...[]).data;
    const salt = getSaltFromKey('1');

    const tx = await source.crossChainDeployer.deployContract(destination.name, destination.crossChainDeployer.address, bytecode, salt, {
        value: fee,
    });

    const txFinished = await tx.wait(1);
    console.log({ txFinished });
}

module.exports = {
    deploy,
    execute,
};
