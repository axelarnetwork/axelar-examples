'use strict';

const {
    utils: { setJSON },
} = require('@axelar-network/axelar-local-dev');
const { readChainConfig } = require('./utils');
const { getDefaultProvider, utils } = require('ethers');
const { configPath } = require('../../config');

/**
 * Deploy a contract to a list of chains.
 * @param {string} env - The environment to deploy to.
 * @param {Chain[]} chains - The chain objects to deploy to.
 * @param {Wallet} wallet - The wallet to use for deployment.
 * @param {Object} example - The example to deploy.
 */
async function deploy(env, chains, wallet, example) {
    await deployOnAltChain(example);
    await deployOnEvmChain(chains, wallet, example);
    await postDeploy(chains, wallet, example);

    // Serialize the contracts by storing the human-readable abi with the address in the json file.
    for (const chain of chains) {
        for (const key of Object.keys(chain)) {
            if (isSerializableContract(chain[key])) {
                chain[key] = serializeContract(chain[key]);
            }
        }

        // Remove the wallet from the chain objects.
        delete chain.wallet;
    }

    // Write the chain objects to the json file.
    setJSON(chains, `./chain-config/${env}-evm.json`);
}

// Run the deployOnAltChain function if it exists.
async function deployOnAltChain(example) {
    if (!example.deployOnAltChain) return;

    const payload = await example.deployOnAltChain();

    // update the chain config file
    if (payload) {
        const { data, path } = payload;

        const config = readChainConfig(configPath.localCosmosChains);
        if (config) {
            setJSON(
                {
                    ...config,
                    ...data,
                },
                path,
            );
        }
    }

    return payload;
}

// Deploy the contracts.
function deployOnEvmChain(chains, wallet, example) {
    const key = new Date().getTime().toString();
    const deploys = chains.map((chain) => {
        const provider = getDefaultProvider(chain.rpc);
        return example.deploy(chain, wallet.connect(provider), key);
    });

    return Promise.all(deploys);
}

// Run the postDeploy function if it exists.
function postDeploy(chains, wallet, example) {
    if (!example.postDeploy) return;

    const deploys = chains.map((chain) => {
        const provider = getDefaultProvider(chain.rpc);
        return example.postDeploy(chain, chains, wallet.connect(provider));
    });

    return Promise.all(deploys);
}

function serializeContract(contract) {
    return {
        abi: contract.interface.format(utils.FormatTypes.full),
        address: contract.address,
    };
}

function isSerializableContract(obj) {
    return obj && obj.interface;
}

module.exports = {
    deploy,
};
