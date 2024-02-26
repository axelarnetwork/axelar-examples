const fs = require('fs');
const { ethers } = require('ethers');
const { createAndExport, EvmRelayer, RelayerType } = require('@axelar-network/axelar-local-dev');
const { AxelarRelayerService, defaultAxelarChainInfo } = require('@axelar-network/axelar-local-dev-cosmos');
const { enabledCosmos } = require('./config');
const { configPath } = require('../../config');
const path = require('path');

const evmRelayer = new EvmRelayer();

const relayers = { evm: evmRelayer };

/**
 * Start the local chains with Axelar contracts deployed.
 * aUSDC is deployed and funded to the given addresses.
 * @param {*} fundAddresses - addresses to fund with aUSDC
 * @param {*} chains - chains to start. All chains are started if not specified (Avalanche, Moonbeam, Polygon, Fantom, Ethereum).
 */
async function start(fundAddresses = [], chains = [], options = {}) {
    // For testing purpose
    const { skipCosmos } = options;
    const dropConnections = [];

    if (!skipCosmos && enabledCosmos) {
        const { startChains } = require('@axelar-network/axelar-local-dev-cosmos');

        // Spin up cosmos chains in docker containers
        await startChains().catch((e) => {
            console.log(e);
        });

        // set relayer for cosmos
        relayers.wasm = await AxelarRelayerService.create(defaultAxelarChainInfo);
        const ibcRelayer = relayers.wasm.ibcRelayer;

        const cosmosConfig = {
            srcChannelId: ibcRelayer.srcChannelId,
            dstChannelId: ibcRelayer.destChannelId,
        };

        evmRelayer.setRelayer(RelayerType.Wasm, relayers.wasm);

        // check if folder is available
        const dirname = path.dirname(configPath.localCosmosChains);

        if (!fs.existsSync(dirname)) {
            fs.mkdirSync(dirname, { recursive: true });
        }

        // write that to cosmos config path
        fs.writeFileSync(configPath.localCosmosChains, JSON.stringify(cosmosConfig, null, 2));

        dropConnections.push(() => ibcRelayer.stopInterval());
        dropConnections.push(() => relayers.wasm.stopListening());
    }

    await createAndExport({
        chainOutputPath: configPath.localEvmChains,
        accountsToFund: fundAddresses,
        callback: (chain, _info) => deployAndFundUsdc(chain, fundAddresses),
        chains: chains.length !== 0 ? chains : null,
        relayers,
        relayInterval: options.relayInterval,
    });

    return async () => {
        for (const dropConnection of dropConnections) {
            await dropConnection();
        }
    };
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

module.exports = {
    start,
    evmRelayer,
    relayers,
};
