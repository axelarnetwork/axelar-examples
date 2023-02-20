'use strict';

require('dotenv').config();
const {
    utils: { setJSON },
} = require('@axelar-network/axelar-local-dev');
const { Wallet, getDefaultProvider } = require('ethers');
const { FormatTypes } = require('ethers/lib/utils');
const path = require('path');

const rootPath = path.resolve(__dirname, '..');
global.rootRequire = (name) => require(`${rootPath}/${name}`);

async function deploy(env, chains, wallet, example) {
    if (example.preDeploy) {
        await example.preDeploy(chains, wallet);
    }

    const promises = [];

    for (const chain of chains) {
        const rpc = chain.rpc;
        const provider = getDefaultProvider(rpc);
        promises.push(example.deploy(chain, wallet.connect(provider)));
    }

    await Promise.all(promises);

    if (example.postDeploy) {
        for (const chain of chains) {
            const rpc = chain.rpc;
            const provider = getDefaultProvider(rpc);
            promises.push(example.postDeploy(chain, chains, wallet.connect(provider)));
        }

        await Promise.all(promises);
    }

    for (const chain of chains) {
        for (const key of Object.keys(chain)) {
            if (chain[key].interface) {
                const contract = chain[key];
                const abi = contract.interface.format(FormatTypes.full);
                chain[key] = {
                    abi,
                    address: contract.address,
                };
            }
        }

        delete chain.wallet;
    }

    setJSON(chains, `./chain-config/${env}.json`);
}

module.exports = {
    deploy,
};

if (require.main === module) {
    const destDir = path.resolve(__dirname, '..', `examples/${process.argv[2]}/index.js`);
    const pathname = path.relative(__dirname, destDir);
    const example = require(pathname);

    const env = process.argv[3];
    if (env == null || (env !== 'testnet' && env !== 'local'))
        throw new Error('Need to specify testnet or local as an argument to this script.');
    let temp;

    if (env === 'local') {
        temp = require(`../chain-config/local.json`);
    } else {
        // const chains = require(`@axelar-network/axelar-cgp-solidity/info/testnet.json`);
        const testnet = require(`../chain-config/testnet.json`);
        const chainsWanted = ['avalanche', 'polygon'];
        temp = testnet.filter((ch) => chainsWanted.includes(ch.name.toLowerCase()));
        temp = temp.map((chain) => ({
            ...chain,
            gasService: chain.AxelarGasService.address,
        }));
    }

    const chains = temp;

    const privateKey = process.env.EVM_PRIVATE_KEY;
    const wallet = new Wallet(privateKey);

    deploy(env, chains, wallet, example);
}
