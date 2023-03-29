const { ethers } = require('ethers');
const { createAndExport, createAptosNetwork } = require('@axelar-network/axelar-local-dev');
const path = require('path');

/**
 * Start the local chains with Axelar contracts deployed.
 * aUSDC is deployed and funded to the given addresses.
 * @param {*} fundAddresses - addresses to fund with aUSDC
 * @param {*} chains - chains to start. All chains are started if not specified (Avalanche, Moonbeam, Polygon, Fantom, Ethereum).
 */
async function start(fundAddresses = [], chains = [], options = {}) {
    await initAptos();

    const pathname = path.resolve(__dirname, '../..', 'chain-config', 'local.json');

    await createAndExport({
        chainOutputPath: pathname,
        accountsToFund: fundAddresses,
        callback: (chain, _info) => deployAndFundUsdc(chain, fundAddresses),
        chains: chains.length !== 0 ? chains : null,
        relayInterval: options.relayInterval,
    });
}

/**
 * Deploy aUSDC and fund the given addresses with 1e12 aUSDC.
 * @param {*} chain - chain to deploy aUSDC on
 * @param {*} toFund - addresses to fund with aUSDC
 */
async function deployAndFundUsdc(chain, toFund) {
    await chain.deployToken('Axelar Wrapped aUSDC', 'aUSDC', 6, ethers.utils.parseEther('1000'));

    for (const address of toFund) {
        await chain.giveToken(address, 'aUSDC', ethers.utils.parseEther('1'));
    }
}

/**
 * Initialize aptos if it is running.
 * If aptos is not running, skip initialization and print a message.
 */
async function initAptos() {
    try {
        await createAptosNetwork({
            nodeUrl: 'http://0.0.0.0:8080',
            faucetUrl: 'http://0.0.0.0:8081',
        });
    } catch (e) {
        console.log(e);
        console.log('Skip Aptos initlization, rerun this after starting an aptos node for proper support.');
    }
}

module.exports = {
    start,
};
