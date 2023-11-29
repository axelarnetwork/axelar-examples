'use strict';

const {
    utils: { deployContract }, getNetwork,
} = require('@axelar-network/axelar-local-dev');
const {decodeError} = require('ethers-decode-error');
const { IInterchainTokenService } = require('@axelar-network/axelar-local-dev/dist/contracts');
const { Contract } = require('ethers');
const { keccak256, defaultAbiCoder } = require('ethers/lib/utils');

const CustomToken = rootRequire('./artifacts/examples/evm/its-custom-token/CustomToken.sol/CustomToken.json');
const ITokenManager = rootRequire('./artifacts/@axelar-network/interchain-token-service/contracts/interfaces/ITokenManager.sol/ITokenManager.json');
const MINT_BURN = 0;

async function deploy(chain, wallet) {
    console.log(`Deploying CustomToken for ${chain.name}.`);
    chain.customToken = await deployContract(wallet, CustomToken, ['Custon Token', 'CT', 18]);
    chain.wallet = wallet;
    console.log(`Deployed CustomToken for ${chain.name} at ${chain.customToken.address}.`);

    const salt = keccak256(defaultAbiCoder.encode(['uint256', 'uint256'], [process.pid, process.ppid]));
    console.log(`Registering custom token at ${chain.customToken.address} using ${salt} as the salt`);
    const params = defaultAbiCoder.encode(['bytes', 'address'], [wallet.address, chain.customToken.address]);
    const its = new Contract(chain.interchainTokenService, IInterchainTokenService.abi, wallet);
    await (await its.deployTokenManager(salt, '', MINT_BURN, params, 0)).wait();
    const tokenId = await its.interchainTokenId(wallet.address, salt);
    const tokenManagerAddress = await its.tokenManagerAddress(tokenId);
    chain.customTokenManager = new Contract(tokenManagerAddress, ITokenManager.abi, wallet);
    
    await (await chain.customToken.addDistributor(tokenManagerAddress)).wait();
    await (await chain.customToken.addDistributor(wallet.address)).wait();
    console.log(`Registered custom token at ${chain.customToken.address} and got a token manager at ${tokenManagerAddress}`);
}

async function execute(chains, wallet, options) {
    const args = options.args || [];
    const { source, destination, calculateBridgeFee } = options;
    const amount = args[2] || 1000;
    

    let balance;
    async function logValue() {
        balance = await destination.customToken.balanceOf(wallet.address);
        console.log(`value at ${destination.name} is ${balance}`);
    }

    console.log('--- Initially ---');
    await logValue();

    const fee = await calculateBridgeFee(source, destination);

    const its = new Contract(source.interchainTokenService, IInterchainTokenService.abi, wallet.connect(source.provider));
    console.log(await its.trustedAddress(destination.name), destination.interchainTokenService);

    console.log(`Minting ${amount} of custom tokens to ${wallet.address}`);
    await (await source.customToken.mint(wallet.address, amount)).wait();

    console.log(`Sending ${amount} of custom tokens to ${destination.name}`);

    const tx = await source.customTokenManager.interchainTransfer(destination.name, wallet.address, amount, '0x', {
        value: fee,
    });
    await tx.wait();

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    while (Number(balance) == Number(await destination.customToken.balanceOf(wallet.address))) {
        await sleep(1000);
    }

    console.log('--- After ---');
    await logValue();
}

module.exports = {
    deploy,
    execute,
};

