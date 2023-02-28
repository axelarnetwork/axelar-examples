'use strict';

const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');

const BreedableNFT = rootRequire('./artifacts/examples/evm/breedable-nft/BreedableNFT.sol/BreedableNFT.json');

async function deploy(chain, wallet) {
    console.log(`Deploying BreedableNFT for ${chain.name}.`);
    chain.contract = await deployContract(wallet, BreedableNFT, [chain.gateway, chain.gasService]);
    // chain.contract = await deployContract(wallet, BreedableNFT);
    chain.wallet = wallet;
    console.log(`Deployed BreedableNFT for ${chain.name} at ${chain.contract.address}.`);
    console.log(`Deployed by ${await chain.contract.owner()}`)
}

async function execute(chains, wallet, options) {
    const args = options.args || [];
    const { source, destination, calculateBridgeFee } = options;
    const message = args[2] || `Hello ${destination.name} from ${source.name}, it is ${new Date().toLocaleTimeString()}.`;

    async function logValue() {
        const counter = await destination.contract.tokenIdCounter();
        console.log(`# of NFTs at ${destination.name} is ${counter}`);
        console.log(`Status of NFT at ${destination.name} is ${await destination.contract.status()}`);
        console.log(`Status of NFT at ${source.name} is ${await source.contract.status()}`);
    }

    console.log('--- Initially ---');
    await logValue();

    const fee = await calculateBridgeFee(source, destination);
    console.log('Fee calculated to be',fee,'for chain pair.');

    const tx = await source.contract.breedWithRemote(destination.name, destination.contract.address, message, 1, 1, {
        value: fee,
    });
    await tx.wait();

    console.log('Breeding intiaited.');

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    console.log('Waiting for destination NFT to be minted.');
    await logValue();
    while ((await destination.contract.tokenIdCounter()) != 2) {
        await sleep(1000);
        console.log('Still waiting...');
        await logValue();
    }

    console.log('--- After ---');
    await logValue();
    // console.log(`owner of remote nft on ${destination.name} is "${await destination.contract.ownerOf(0)}"`);
    
}

module.exports = {
    deploy,
    execute,
};
