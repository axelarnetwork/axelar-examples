'use strict';

const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');
const { IInterchainTokenService } = require('@axelar-network/axelar-local-dev/dist/contracts');
const ITokenManagerProxy = require('@axelar-network/interchain-token-service/artifacts/contracts/interfaces/ITokenManagerProxy.sol/ITokenManagerProxy.json');
const { Contract } = require('ethers');
const { keccak256, defaultAbiCoder } = require('ethers/lib/utils');
const { interchainTransfer, transmitInterchainTransfer } = require('../../../scripts/libs/its-utils');

// const BurnableToken = rootRequire('./artifacts/examples/evm/its-custom-token/CustomToken.sol/CustomToken.json');
const BurnableToken = rootRequire('./artifacts/examples/evm/its-mint-burn-from/BurnableToken.sol/BurnableToken.json');

const ITokenManager = rootRequire(
    './artifacts/@axelar-network/interchain-token-service/contracts/interfaces/ITokenManager.sol/ITokenManager.json',
);
const MINT_BURN_FROM = 1;

async function deploy(chain, wallet) {
    console.log(`Deploying Custom Burnable Token for ${chain.name}.`);
    chain.burnableToken = await deployContract(wallet, BurnableToken, ['Custom Burnable Token', 'CT', 18, chain.interchainTokenService]);
    chain.wallet = wallet;
    console.log(`Deployed Custom Burnable Token for ${chain.name} at ${chain.burnableToken.address}.`);
}

async function execute(chains, wallet, options) {
    const args = options.args || [];
    const { source, destination, calculateBridgeFee } = options;

    const amount = args[2] || 1000;
    const salt = args[3] || keccak256(defaultAbiCoder.encode(['uint256', 'uint256'], [process.pid, process.ppid]));

    const fee = await calculateBridgeFee(source, destination);
    let its;
    async function deployTokenManager(chain, salt) {
        console.log(`Registering custom burnable token for ${chain.name}`);
        const params = defaultAbiCoder.encode(['bytes', 'address'], [wallet.address, chain.burnableToken.address]);
        its = new Contract(chain.interchainTokenService, IInterchainTokenService.abi, wallet.connect(chain.provider));
        await (await its.deployTokenManager(salt, '', MINT_BURN_FROM, params, 0)).wait();
        const tokenId = await its.interchainTokenId(wallet.address, salt);
        const tokenManagerAddress = await its.tokenManagerAddress(tokenId);
        const tokenManager = new Contract(tokenManagerAddress, ITokenManager.abi, wallet.connect(chain.provider));
        await (await chain.burnableToken.addMinter(tokenManagerAddress)).wait();
        return tokenManager;
    }

    const tokenManager = await deployTokenManager(source, salt);
    const tokenId = await tokenManager.interchainTokenId();

    await (await source.burnableToken.mint(wallet.address, amount)).wait();
    await (await source.burnableToken.approve(its.address, amount)).wait();

    console.log('Approved token for `transferFrom()`');

    console.log('Deploying new manager on dest');
    await deployTokenManager(destination, salt);

    await interchainTransfer(source, destination, wallet, tokenId, amount, fee);
}

module.exports = {
    deploy,
    execute,
};
