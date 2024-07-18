'use strict';

const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');
const { IInterchainTokenService } = require('@axelar-network/axelar-local-dev/dist/contracts');
const { Contract } = require('ethers');
const { keccak256, defaultAbiCoder } = require('ethers/lib/utils');
const { interchainTransfer } = require('../../../scripts/libs/its-utils');

const FeeToken = rootRequire('./artifacts/examples/evm/its-lock-unlock-fee/FeeToken.sol/FeeToken.json');

const ITokenManager = rootRequire(
    './artifacts/@axelar-network/interchain-token-service/contracts/interfaces/ITokenManager.sol/ITokenManager.json',
);
const LOCK_UNLOCK_FEE = 3;
const MINT_BURN = 4;

const lockFee = (5e16).toString();
async function deploy(chain, wallet) {
    console.log(`Deploying Custom Fee Token for ${chain.name}.`);
    chain.feeToken = await deployContract(wallet, FeeToken, ['Custom Fee Token', 'CFT', 18, fee, chain.interchainTokenService]);
    chain.wallet = wallet;
    console.log(`Deployed Custom Fee Token for ${chain.name} at ${chain.feeToken.address}.`);
}

async function execute(chains, wallet, options) {
    const args = options.args || [];
    const { source, destination, calculateBridgeFee } = options;

    const amount = args[2] || 1e18;
    const salt = args[3] || keccak256(defaultAbiCoder.encode(['uint256', 'uint256'], [process.pid, process.ppid]));

    const fee = await calculateBridgeFee(source, destination);
    let its;
    async function deployTokenManager(chain, tokenManagerType, salt) {
        console.log(`Registering custom fee token for ${chain.name}`);
        const params = defaultAbiCoder.encode(['bytes', 'address'], [wallet.address, chain.feeToken.address]);
        its = new Contract(chain.interchainTokenService, IInterchainTokenService.abi, wallet.connect(chain.provider));
        await (await its.deployTokenManager(salt, '', tokenManagerType, params, 0)).wait();
        const tokenId = await its.interchainTokenId(wallet.address, salt);
        const tokenManagerAddress = await its.tokenManagerAddress(tokenId);
        const tokenManager = new Contract(tokenManagerAddress, ITokenManager.abi, wallet.connect(chain.provider));
        await (await chain.feeToken.addMinter(tokenManagerAddress)).wait();
        return tokenManager;
    }

    const tokenManager = await deployTokenManager(source, LOCK_UNLOCK_FEE, salt);
    const tokenId = await tokenManager.interchainTokenId();

    await (await source.feeToken.mint(wallet.address, amount)).wait();
    await (await source.feeToken.approve(its.address, amount)).wait();

    console.log('Approved token for `transferFrom()`');
    console.log('Deploying new manager on dest');
    await deployTokenManager(destination, MINT_BURN, salt);
    await interchainTransfer(source, destination, wallet, tokenId, amount, lockFee, fee);
}

module.exports = {
    deploy,
    execute,
};
