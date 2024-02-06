const { IInterchainTokenService, IInterchainTokenFactory } = require('@axelar-network/axelar-local-dev/dist/contracts');
const { Contract } = require('ethers');
const { interchainTransfer } = require('../../../scripts/libs/its-utils');
const { keccak256, defaultAbiCoder } = require('ethers/lib/utils');
const { loadMultiversXNetwork } = require('@axelar-network/axelar-local-dev-multiversx');

async function execute(evmChain, wallet, options) {
    const args = options.args || [];

    const client = await loadMultiversXNetwork();

    const interchainTokenServiceAddress = client?.interchainTokenServiceAddress;
    const interchainTokenFactoryAddress = client?.interchainTokenFactoryAddress;

    if (!interchainTokenServiceAddress || !interchainTokenFactoryAddress) {
        throw new Error('Deploy MultiversX contracts before running this!')
    }

    const { calculateBridgeFee } = options;

    const name = args[2] || 'Interchain Token';
    const symbol = args[3] || 'IT';
    const decimals = args[4] || 18;
    const amount = args[5] || 1000;
    const salt = args[6] || keccak256(defaultAbiCoder.encode(['uint256', 'uint256'], [process.pid, process.ppid]));


    const fee = await calculateBridgeFee(evmChain, evmChain);

    const destinationIts = new Contract(evmChain.interchainTokenService, IInterchainTokenService.abi, wallet.connect(evmChain.provider));
    const destinationFactory = new Contract(evmChain.interchainTokenFactory, IInterchainTokenFactory.abi, wallet.connect(evmChain.provider));

    const tokenId = await destinationFactory.interchainTokenId(wallet.address, salt);

    // Evm to MultiversX
    console.log(`Deploying interchain token [${name}, ${symbol}, ${decimals}] at ${evmChain.name}`);
    await (await destinationFactory.deployInterchainToken(
        salt,
        name,
        symbol,
        decimals,
        amount,
        wallet.address,
    )).wait();

    console.log(`Deploying remote interchain token from ${evmChain.name} to multiversx`);
    await (await destinationFactory.deployRemoteInterchainToken(
        '',
        salt,
        wallet.address,
        'multiversx',
        fee,
        {value: fee},
    )).wait();

    // const destinationTokenAddress = await destinationIts.interchainTokenAddress(tokenId);

    // const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    // while (await destination.provider.getCode(destinationTokenAddress) == '0x') {
    //     await sleep(1000);
    // }

    // await interchainTransfer(source, destination, wallet, tokenId, amount, fee);
}

module.exports = {
    execute,
};

