const { ethers } = require('ethers');
const fs = require('fs');
const { createAndExport, EvmRelayer, relay, RelayerType } = require('@axelar-network/axelar-local-dev');
const { IBCRelayerService, AxelarRelayerService, defaultAxelarChainInfo } = require('@axelar-network/axelar-local-dev-cosmos');
const { enabledAptos, enabledCosmos } = require('./config');
const { configPath } = require('../../config');

const evmRelayer = new EvmRelayer();

const relayers = { evm: evmRelayer };

/**
 * Start the local chains with Axelar contracts deployed.
 * aUSDC is deployed and funded to the given addresses.
 * @param {*} fundAddresses - addresses to fund with aUSDC
 * @param {*} chains - chains to start. All chains are started if not specified (Avalanche, Moonbeam, Polygon, Fantom, Ethereum).
 */
async function start(fundAddresses = [], chains = [], options = {}) {
    if (enabledAptos) {
        const { AptosRelayer, createAptosNetwork } = require('@axelar-network/axelar-local-dev-aptos');
        await initAptos(createAptosNetwork);
        relayers.aptos = new AptosRelayer();
        evmRelayer.setRelayer(RelayerType.Aptos, relayers.aptos);
    }

    if (enabledCosmos) {
        const { startAll } = require('@axelar-network/axelar-local-dev-cosmos');

        // Spin up cosmos chains in docker containers
        await startAll();

        const ibcRelayer = await IBCRelayerService.create();
        // Setup IBC Channels. This command will take a while to complete. (should be around 2-3 mins)
        await ibcRelayer.setup();

        const cosmosConfig = {
            srcChannelId: ibcRelayer.srcChannelId,
            dstChannelId: ibcRelayer.destChannelId,
        };

        // set relayer for cosmos
        relayers.wasm = await AxelarRelayerService.create(defaultAxelarChainInfo);
        evmRelayer.setRelayer(RelayerType.Wasm, relayers.wasm);

        await relayers.wasm.listenForEvents();

        try {
            await ibcRelayer.runInterval().catch(() => {});
        } catch (e) {
            console.log(e);
        }

        // write that to cosmos config path
        fs.writeFileSync(configPath.localCosmosChains, JSON.stringify(cosmosConfig, null, 2));
    }

    await createAndExport({
        chainOutputPath: configPath.localEvmChains,
        accountsToFund: fundAddresses,
        callback: (chain, _info) => deployAndFundUsdc(chain, fundAddresses),
        chains: chains.length !== 0 ? chains : null,
        relayers,
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
async function initAptos(createAptosNetwork) {
    try {
        await createAptosNetwork({
            nodeUrl: 'http://0.0.0.0:8080',
            faucetUrl: 'http://0.0.0.0:8081',
        });
    } catch (e) {
        console.log('Skip Aptos initialization, rerun this after starting an aptos node for proper support.');
    }
}

module.exports = {
    start,
    evmRelayer,
    relayers,
};
