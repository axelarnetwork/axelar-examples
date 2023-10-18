'use strict';

const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');

const SampleProxy = rootRequire('./artifacts/examples/evm/cross-chain-deployer/upgradeable/SampleProxy.sol/SampleProxy.json');

const SampleImplementation = rootRequire(
    './artifacts/examples/evm/cross-chain-deployer/upgradeable/SampleImplementation.sol/SampleImplementation.json',
);
const SampleUpgradedImplementation = rootRequire(
    './artifacts/examples/evm/cross-chain-deployer/upgradeable/SampleUpgradedImplementation.sol/SampleUpgradedImplementation.json',
);
const CrossChainDeployer = rootRequire(
    './artifacts/examples/evm/cross-chain-deployer/upgradeable/CrossChainUpgradeableContractDeployer.sol/CrossChainUpgradeableContractDeployer.json',
);
const Create3Deployer = rootRequire(
    './artifacts/@axelar-network/axelar-gmp-sdk-solidity/contracts/deploy/Create3Deployer.sol/Create3Deployer.json',
);
const {
    Contract,
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
    chain.crossChainDeployer = await deployContract(wallet, CrossChainDeployer, [chain.gateway, chain.gasService, wallet.address]);
    console.log(`Deployed CrossChainDeployer for ${chain.name} at ${chain.crossChainDeployer.address}.`);
}

async function execute(chains, wallet, options) {
    const { source, destination } = options;

    const fee = 5000000;
    // const fee = await calculateBridgeFee(source, destination, {
    //     gasLimit: 3000000,
    //     gasMultiplier: 2,
    // });

    const factory = new ContractFactory(SampleImplementation.abi, SampleImplementation.bytecode);
    const bytecode = factory.getDeployTransaction(...[]).data;
    const salt = getSaltFromKey('2');

    const calls = {
        destinationChain: destination.name,
        destinationAddress: destination.crossChainDeployer.address,
        gas: fee,
    };
    const setupParams = defaultAbiCoder.encode(['string'], ['0x']);
    const setWhitelist = await destination.crossChainDeployer.setWhitelistedSourceAddress(
        source.name,
        source.crossChainDeployer.address,
        true,
    );
    await setWhitelist.wait(1);

    const tx = await source.crossChainDeployer.deployRemoteContracts([calls], bytecode, salt, setupParams, {
        value: fee,
    });

    await tx.wait(1);

    const destProvider = new ethers.providers.JsonRpcProvider(destination.rpc);
    const waitForEvent = (signature) =>
        new Promise((resolve, reject) => {
            destProvider.on(
                {
                    address: destination.crossChainDeployer.address,
                    topics: [id(signature)],
                },
                (tx) => resolve(tx),
            );
            destProvider.on('error', (tx) => reject(tx));
        });

    const destTx = await waitForEvent('Deployed(address,bytes32,address,address,string)');
    const destTxReceipt = await destProvider.getTransactionReceipt(destTx.transactionHash);

    const log = new ethers.utils.Interface([
        'event Deployed(address indexed sender, bytes32 indexed userSalt, address indexed proxy, address implementation, string sourceChain)',
    ]).parseLog(destTxReceipt.logs[1]);
    console.log(
        `${SampleImplementation.contractName} deployed on ${destination.name} at ${log.args.implementation} with proxy at ${log.args.proxy} by ${log.args.sender}`,
    );

    const proxy = new Contract(log.args.proxy, SampleProxy.abi, destination.provider);
    const implementationContract = new Contract(log.args.proxy, SampleImplementation.abi, destination.provider);

    let contractId = await proxy.implementation();
    let messageFromImplementationContract = await implementationContract.getSampleMessage();

    console.log({ contractId, messageFromImplementationContract });

    // upgrade the contract on destination chain from destination chain
    const upgradeFromDest = async () => {
        const factory = new ContractFactory(SampleUpgradedImplementation.abi, SampleUpgradedImplementation.bytecode);
        const newImplBytecode = factory.getDeployTransaction(...[]).data;

        const destUpgradeTx = await destination.crossChainDeployer.upgradeUpgradeable(salt, newImplBytecode, setupParams, {
            gasLimit: 5000000,
        });

        await destUpgradeTx.wait(1);

        contractId = await proxy.implementation();
        messageFromImplementationContract = await implementationContract.getSampleMessage();

        console.log({ contractId, messageFromImplementationContract });
    };

    // upgrade the contract on destination chain from src chain
    const upgradeFromSrc = async () => {
        const factory = new ContractFactory(SampleUpgradedImplementation.abi, SampleUpgradedImplementation.bytecode);
        const newImplBytecode = factory.getDeployTransaction(...[]).data;

        const srcUpgradeTx = await source.crossChainDeployer.upgradeRemoteContracts([calls], salt, newImplBytecode, setupParams, {
            value: fee,
        });
        await srcUpgradeTx.wait(1);
        await waitForEvent('Upgraded(address,bytes32,address,address,string)');

        contractId = await proxy.implementation();
        messageFromImplementationContract = await implementationContract.getSampleMessage();

        console.log({ contractId, messageFromImplementationContract });
    };

    await upgradeFromSrc();
}

module.exports = {
    deploy,
    execute,
};
