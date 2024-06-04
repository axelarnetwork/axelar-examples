'use strict';

const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');
const { IInterchainTokenService } = require('@axelar-network/axelar-local-dev/dist/contracts');
const { Contract } = require('ethers');
const { keccak256, defaultAbiCoder } = require('ethers/lib/utils');
const { interchainTransfer } = require('../../../scripts/libs/its-utils');

const CustomToken = rootRequire('./artifacts/examples/evm/its-custom-token/CustomToken.sol/CustomToken.json');
const ITokenManager = rootRequire('./artifacts/@axelar-network/interchain-token-service/contracts/interfaces/ITokenManager.sol/ITokenManager.json');
const CUSTOM_MINT_BURN = 4;

async function deploy(chain, wallet) {
    console.log(`Deploying CustomToken for ${chain.name}.`);
    chain.customToken = await deployContract(wallet, CustomToken, ['Custon Token', 'CT', 18, chain.interchainTokenService]);
    chain.wallet = wallet;
    console.log(`Deployed CustomToken for ${chain.name} at ${chain.customToken.address}.`);
}



async function execute(chains, wallet, options) {
    const args = options.args || [];
    const { source, destination, calculateBridgeFee } = options;    
    
    const amount = args[2] || 1000;
    const salt = args[3] || keccak256(defaultAbiCoder.encode(['uint256', 'uint256'], [process.pid, process.ppid]));


    const fee = await calculateBridgeFee(source, destination);

    async function deployTokenManager(chain, salt) {
        console.log(`Registering custom token at for ${chain.name}`);

        const params = defaultAbiCoder.encode(['bytes', 'address'], [wallet.address, chain.customToken.address]);
        const its = new Contract(chain.interchainTokenService, IInterchainTokenService.abi, wallet.connect(chain.provider));
        await (await its.deployTokenManager(salt, '', CUSTOM_MINT_BURN, params, 0)).wait();
        const tokenId = await its.interchainTokenId(wallet.address, salt);
        const tokenManagerAddress = await its.tokenManagerAddress(tokenId);
        const tokenManager = new Contract(tokenManagerAddress, ITokenManager.abi, wallet.connect(chain.provider));
        await (await chain.customToken.addMinter(tokenManagerAddress)).wait();
        return tokenManager;
    } 

    const tokenManager = await deployTokenManager(source, salt);
    await deployTokenManager(destination, salt);

    const tokenId = await tokenManager.interchainTokenId();

    console.log(`Minting ${amount} of custom tokens to ${wallet.address}`);
    await (await source.customToken.mint(wallet.address, amount)).wait();

    await interchainTransfer(source, destination, wallet, tokenId, amount, fee);
}

module.exports = {
    deploy,
    execute,
};