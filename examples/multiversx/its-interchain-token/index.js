const { IInterchainTokenService, IInterchainTokenFactory } = require('@axelar-network/axelar-local-dev/dist/contracts');
const { Contract } = require('ethers');
const { interchainTransfer } = require('../../../scripts/libs/its-utils');
const { keccak256, defaultAbiCoder } = require('ethers/lib/utils');
const { loadMultiversXNetwork } = require('@axelar-network/axelar-local-dev-multiversx');
const { CHAINS } = require('@axelar-network/axelarjs-sdk');
const IERC20 = require('@axelar-network/axelar-gmp-sdk-solidity/artifacts/contracts/interfaces/IERC20.sol/IERC20.json');

async function execute(evmChain, wallet, options) {
    const args = options.args || [];

    const client = await loadMultiversXNetwork();

    const interchainTokenServiceAddress = client?.interchainTokenServiceAddress;
    const interchainTokenFactoryAddress = client?.interchainTokenFactoryAddress;

    if (!interchainTokenServiceAddress || !interchainTokenFactoryAddress) {
        throw new Error('Deploy MultiversX contracts before running this!')
    }

    const { calculateBridgeFee } = options;

    const name = args[2] || 'InterchainToken';
    const symbol = args[3] || 'ITE';
    const decimals = args[4] || 18;
    const amount = args[5] || 1000;
    const salt = args[6] || keccak256(defaultAbiCoder.encode(['uint256', 'uint256'], [process.pid, process.ppid]));

    // Can not calculate fee for MultiversX yet, so instead we use Axelar testnet
    // const fee = await calculateBridgeFee(evmChain, { name: CHAINS.TESTNET.AXELAR });
    const fee = await calculateBridgeFee(evmChain, evmChain);

    const evmIts = new Contract(evmChain.interchainTokenService, IInterchainTokenService.abi, wallet.connect(evmChain.provider));
    const evmItsFactory = new Contract(evmChain.interchainTokenFactory, IInterchainTokenFactory.abi, wallet.connect(evmChain.provider));

    const tokenId = await evmItsFactory.interchainTokenId(wallet.address, salt);

    // Evm to MultiversX
    console.log(`Deploying interchain token [${name}, ${symbol}, ${decimals}] at ${evmChain.name}`);
    await (await evmItsFactory.deployInterchainToken(
        salt,
        name,
        symbol,
        decimals,
        amount,
        wallet.address,
    )).wait();

    console.log(`Deploying remote interchain token from ${evmChain.name} to multiversx`);
    await (await evmItsFactory.deployRemoteInterchainToken(
        '',
        salt,
        wallet.address,
        'multiversx',
        fee,
        {value: fee},
    )).wait();

    console.log('Token id', tokenId);

    const evmTokenAddress = await evmIts.interchainTokenAddress(tokenId);

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    while (await evmChain.provider.getCode(evmTokenAddress) === '0x') {
        await sleep(1000);
    }

    let tokenIdentifier;
    let retries = 0;
    while (!(tokenIdentifier = await client.its.getValidTokenIdentifier(tokenId))) {
        if (retries >= 5) {
            throw new Error('Could not deploy ESDT on MultiversX');
        }

        await sleep(30000);
        retries++;
    }

    console.log('Token identifier', tokenIdentifier);

    await interchainTransferEvmToMultiversX(evmChain, client, wallet, evmTokenAddress, tokenIdentifier, tokenId, amount, fee);
}

async function interchainTransferEvmToMultiversX(evmChain, client, wallet, evmTokenAddress, tokenIdentifier, tokenId, amount, fee) {
    const sourceIts = new Contract(evmChain.interchainTokenService, IInterchainTokenService.abi, wallet.connect(evmChain.provider));

    let balance;
    async function logValue() {
        balance = (await client.getFungibleTokenOfAccount(client.owner, tokenIdentifier)).balance?.toString();
        console.log(`Balance at MultiversX is ${balance} for ${tokenIdentifier}`);
    }

    console.log('--- Initially ---');
    await logValue();

    console.log(`Sending ${amount} of token ${evmTokenAddress} from ${evmChain.name} to MultiversX`);

    const tx = await sourceIts.interchainTransfer(tokenId, 'multiversx', client.owner.pubkey(), amount, '0x', fee, {
        value: fee,
    });
    await tx.wait();

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    let retries = 0;
    while (balance === (await client.getFungibleTokenOfAccount(client.owner, tokenIdentifier)).balance?.toString()) {
        if (retries >= 5) {
            throw new Error('Did not receive ESDT transfer on MultiversX');
        }

        await sleep(6000);
        retries++;
    }

    console.log('--- After ---');
    await logValue();
}

module.exports = {
    execute,
};

