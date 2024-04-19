'use strict';

const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');

const MultichainNFTMint = rootRequire('./artifacts/examples/evm/multichain-nft-mint/MultichainNFTMint.sol/MultichainNFTMint.json');
const MockNFT = rootRequire('./artifacts/examples/evm/multichain-nft-mint/mocks/MockNFT.sol/MockNFT.json');

async function deploy(chain, wallet) {
    console.log(`Deploying Mock NFT for ${chain.name}.`);
    chain.mockNFT = await deployContract(wallet, MockNFT);
    console.log(`Deployed Mock NFT for ${chain.name} at ${chain.mockNFT.address}.`);

    console.log(`Deploying MultichainNFTMint for ${chain.name}.`);
    chain.multichainNFT = await deployContract(wallet, MultichainNFTMint, [chain.gateway, chain.gasService, chain.mockNFT.address]);
    chain.wallet = wallet;
    console.log(`Deployed MultichainNFTMint for ${chain.name} at ${chain.multichainNFT.address}.`);
}

async function execute(chains, wallet, options) {
    const args = options.args || [];
    const { source, destination, calculateBridgeFee } = options;
    const receivingAddr = args[2];
    const tokenId = args[3];

    async function logValue() {
        console.log(`balance of ${receivingAddr} at ${destination.name} is "${await destination.mockNFT.balanceOf(receivingAddr)}"`);
    }

    console.log('--- Initially ---');
    await logValue();

    const fee = await calculateBridgeFee(source, destination);

    const tx = await source.multichainNFT.mintNftOnDestChain(destination.name, destination.multichainNFT.address, receivingAddr, tokenId, {
        value: fee,
    });
    await tx.wait();

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    while ((await destination.mockNFT.balanceOf(receivingAddr)) == '0') {
        await sleep(1000);
    }

    console.log('--- After ---');
    await logValue();
}

module.exports = {
    deploy,
    execute,
};
