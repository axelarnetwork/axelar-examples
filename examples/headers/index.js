'use strict';

const { getDefaultProvider, Contract } = require('ethers');
const { deployUpgradable } = require('@axelar-network/axelar-gmp-sdk-solidity');

const ExampleProxy = require('../../artifacts/examples/Proxy.sol/ExampleProxy.json');
const Headers = require('../../artifacts/examples/headers/Headers.sol/Headers.json');
const Gateway = require('../../artifacts/@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol/IAxelarGateway.json');
const IERC20 = require('../../artifacts/@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol/IERC20.json');

async function deploy(chain, wallet) {
    console.log(`Deploying Headers for ${chain.name}.`);
    chain.provider = getDefaultProvider(chain.rpc);
    chain.wallet = wallet.connect(chain.provider);
    chain.contract = await deployUpgradable(
        chain.constAddressDeployer,
        chain.wallet,
        Headers,
        ExampleProxy,
        [chain.gateway, chain.gasReceiver, 10],
        [],
        '0x',
        'headers',
    );
    const gateway = new Contract(chain.gateway, Gateway.abi, chain.wallet);
    const usdcAddress = await gateway.tokenAddresses('aUSDC');
    chain.usdc = new Contract(usdcAddress, IERC20.abi, chain.wallet);
    console.log(`Deployed Headers for ${chain.name} at ${chain.contract.address}.`);
}

async function test(chains, wallet, options) {
    const args = options.args || [];
    const getGasPrice = options.getGasPrice;

    const source = chains.find((chain) => chain.name === (args[0] || 'Avalanche'));
    const destination = chains.find((chain) => chain.name === (args[1] || 'Fantom'));

    function sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, ms);
        });
    }

    const gasLimit = 3e5;
    const gasPrice = await getGasPrice(source, destination, source.usdc.address);

    await (await source.usdc.approve(source.contract.address, BigInt(gasLimit * gasPrice))).wait();

    const tx = await (
        await source.contract.updateRemoteHeaders(source.usdc.address, [destination.name], [BigInt(gasLimit * gasPrice)])
    ).wait();
    const hash = (await source.provider.getBlock(tx.blockNumber - 1)).hash;

    while (true) {
        const remoteHash = await destination.contract.getHeader(source.name, 0).catch(() => ({}));
        if (remoteHash.header_ === hash && tx.blockNumber - 1 === remoteHash.block_.toNumber()) break;
        await sleep(1000);
    }

    console.log('Success!');
}

module.exports = {
    deploy,
    test,
};
