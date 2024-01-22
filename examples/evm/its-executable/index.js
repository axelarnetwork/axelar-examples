'use strict';

const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');
const { IInterchainTokenService, IInterchainTokenFactory } = require('@axelar-network/axelar-local-dev/dist/contracts');
const { Contract } = require('ethers');
const { keccak256, defaultAbiCoder } = require('ethers/lib/utils');
const IERC20 = require('@axelar-network/axelar-gmp-sdk-solidity/artifacts/contracts/interfaces/IERC20.sol/IERC20.json');


const InterchainExecutableExample = rootRequire('./artifacts/examples/evm/its-executable/InterchainExecutableExample.sol/InterchainExecutableExample.json');

async function deploy(chain, wallet) {
    console.log(`Deploying InterchainExecutableExample for ${chain.name}.`);
    chain.itsExecutable = await deployContract(wallet, InterchainExecutableExample, [chain.interchainTokenService]);
    chain.wallet = wallet;
    console.log(`Deployed CustomToken for ${chain.name} at ${chain.itsExecutable.address}.`);
}



async function execute(chains, wallet, options) {
    const args = options.args || [];
    const { source, destination, calculateBridgeFee } = options;  
    
    const message = args[2] || `Hello ${destination.name} from ${source.name}, the time is ${(new Date()).toLocaleString()}`;
    const amount = args[3] || 1000;
    console.log(message);

    const name = 'Interchain Token';
    const symbol = 'IT';
    const decimals = 18;
    const salt = keccak256(defaultAbiCoder.encode(['uint256', 'uint256'], [process.pid, process.ppid]));
    
    const fee = await calculateBridgeFee(source, destination);

    const sourceIts = new Contract(source.interchainTokenService, IInterchainTokenService.abi, wallet.connect(source.provider));
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
    
    const sourceTokenAddress = await sourceIts.interchainTokenAddress(tokenId);
    const destinationTokenAddress = await destinationIts.interchainTokenAddress(tokenId);

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    while (await destination.provider.getCode(destinationTokenAddress) == '0x') {
        await sleep(1000);
    }

    const sourceToken = new Contract(sourceTokenAddress, IERC20.abi, wallet.connect(source.provider));
    const destinationToken = new Contract(destinationTokenAddress, IERC20.abi, destination.provider);
    let balance;
    async function logValue() {
        balance = await destinationToken.balanceOf(wallet.address);
        console.log(`Balance at ${destination.name} is ${balance}`);
        console.log(`Last message at ${destination.name} is ${await destination.itsExecutable.lastMessage()}`);
    }

    console.log('--- Initially ---');
    await logValue();

    console.log(`Sending ${amount} of token ${destinationTokenAddress} to ${destination.name} and executing with it.`);

    // We need to apoprove the executable before it can use our token.
    let tx = await sourceToken.approve(source.itsExecutable.address, amount);
    await tx.wait();

    tx = await source.itsExecutable.sendInterchainTokenWithData(destination.name, destination.itsExecutable.address, tokenId, amount, wallet.address, message, {
        value: fee,
    });
    await tx.wait();

    while (Number(balance) == Number(await destinationToken.balanceOf(wallet.address))) {
        await sleep(1000);
    }

    console.log('--- After ---');
    await logValue();
    
}

module.exports = {
    deploy,
    execute,
};

