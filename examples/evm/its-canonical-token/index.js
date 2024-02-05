'use strict';

const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');
const { IInterchainTokenService, IInterchainTokenFactory } = require('@axelar-network/axelar-local-dev/dist/contracts');
const { Contract } = require('ethers');
const { interchainTransfer } = require('../../../scripts/libs/its-utils');

const CanonicalToken = rootRequire('./artifacts/examples/evm/its-canonical-token/CanonicalToken.sol/CanonicalToken.json');

async function deploy(chain, wallet) {
    console.log(`Deploying CanonicalToken for ${chain.name}.`);
    chain.canonicalToken = await deployContract(wallet, CanonicalToken, ['Custon Token', 'CT', 18]);
    chain.wallet = wallet;
    console.log(`Deployed CanonicalToken for ${chain.name} at ${chain.canonicalToken.address}.`);
}

async function execute(chains, wallet, options) {
    const args = options.args || [];
    const { source, destination, calculateBridgeFee } = options;    
    
    const amount = args[2] || 1000;

    const fee = await calculateBridgeFee(source, destination);

    const sourceIts = new Contract(source.interchainTokenService, IInterchainTokenService.abi, wallet.connect(source.provider));
    const destinationIts = new Contract(destination.interchainTokenService, IInterchainTokenService.abi, wallet.connect(destination.provider));
    const sourceFactory = new Contract(source.interchainTokenFactory, IInterchainTokenFactory.abi, wallet.connect(source.provider));

    console.log(`Registerring canonical token ${source.canonicalToken.address} at ${source.name}`);
    await (await sourceFactory.registerCanonicalInterchainToken(source.canonicalToken.address)).wait();

    console.log(`Deploy remote canonical token from ${source.name} to ${destination.name}`);
    await (await sourceFactory.deployRemoteCanonicalInterchainToken('', source.canonicalToken.address, destination.name, fee, {value: fee})).wait();
    
    const tokenId = await sourceFactory.canonicalInterchainTokenId(source.canonicalToken.address);
    const destinationTokenAddress = await destinationIts.interchainTokenAddress(tokenId);

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    while (await destination.provider.getCode(destinationTokenAddress) == '0x') {
        await sleep(1000);
    }

    console.log(`Minting ${amount} canonical tokens to ${wallet.address}`);
    await (await source.canonicalToken.mint(wallet.address, amount)).wait();

    console.log(`Approving ${amount} canonical tokens to the token manager`);
    await (await source.canonicalToken.approve(source.interchainTokenService, amount)).wait();

    await interchainTransfer(source, destination, wallet, tokenId, amount, fee);
}

module.exports = {
    deploy,
    execute,
};

