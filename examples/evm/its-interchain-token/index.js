'use strict';

const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');
const { IInterchainTokenService, IInterchainTokenFactory } = require('@axelar-network/axelar-local-dev/dist/contracts');
const { Contract } = require('ethers');
const { interchainTransfer } = require('../../../scripts/libs/its-utils');
const { keccak256, defaultAbiCoder } = require('ethers/lib/utils');

async function execute(chains, wallet, options) {
    const args = options.args || [];
    const { source, destination, calculateBridgeFee } = options;  

    const name = args[2] || 'Interchain Token';
    const symbol = args[3] || 'IT';
    const decimals = args[4] || 18;
    const salt = args[5] || keccak256(defaultAbiCoder.encode(['uint256', 'uint256'], [process.pid, process.ppid]));
    const amount = args[6] || 1000;

    const fee = await calculateBridgeFee(source, destination);

    const destinationIts = new Contract(destination.interchainTokenService, IInterchainTokenService.abi, wallet.connect(destination.provider));
    const sourceFactory = new Contract(source.interchainTokenFactory, IInterchainTokenFactory.abi, wallet.connect(source.provider));

    const tokenId = await sourceFactory.interchainTokenId(wallet.address, salt);

    console.log(`Deploying interchain token [${name}, ${symbol}, ${decimals}] at ${source.name}`);
    await (await sourceFactory.deployInterchainToken(        
        salt,
        name,
        symbol,
        decimals,
        amount,
        wallet.address,
    )).wait();

    console.log(`Deploying remote interchain token from ${source.name} to ${destination.name}`);
    await (await sourceFactory.deployRemoteInterchainToken(
        '',
        salt,
        wallet.address,
        destination.name,
        fee,
        {value: fee},
    )).wait();
    
    const destinationTokenAddress = await destinationIts.interchainTokenAddress(tokenId);

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    while (await destination.provider.getCode(destinationTokenAddress) == '0x') {
        await sleep(1000);
    }

    await interchainTransfer(source, destination, wallet, tokenId, amount, fee);
}

module.exports = {
    execute,
};

