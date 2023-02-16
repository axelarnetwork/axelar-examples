const {
    constants: { AddressZero },
    Wallet,
    ethers,
} = require('ethers');
const axios = require('axios');
const axelarLocal = require('@axelar-network/axelar-local-dev');
const { AxelarAssetTransfer } = require('@axelar-network/axelarjs-sdk');

const rootPath = path.resolve(__dirname, '../..');
global.rootRequire = (name) => require(`${rootPath}/${name}`);

/**
 * Get the wallet from the environment variables. If the EVM_PRIVATE_KEY environment variable is set, use that. Otherwise, use the EVM_MNEMONIC environment variable.
 * @returns {Wallet} - The wallet.
 */
function getWallet() {
    checkWallet();
    const privateKey = process.env.EVM_PRIVATE_KEY;
    return privateKey ? new Wallet(privateKey) : Wallet.fromMnemonic(process.env.EVM_MNEMONIC);
}

/**
 * Get the chain objects from the chain-config file.
 * @param {*} env - The environment to get the chain objects for. Available options are 'local' and 'testnet'.
 * @returns {Chain[]} - The chain objects.
 */
function getChains(env) {
    checkEnv();

    if (env === 'local') {
        return rootRequire('chain-config/local.json');
    }

    return require(`@axelar-network/axelar-cgp-solidity/info/testnet.json`);
}

/**
 * Get the balances of an address on a list of chains.
 * @param {*} chains - The list of chains to get the balances from.
 * @param {*} address - The address to get the balances for.
 * @returns {Object} - The balances of the address on each chain.
 */
async function getBalances(chains, address) {
    const balances = await Promise.all(
        chains.map((chain) => {
            const provider = ethers.providers.JsonRpcProvider(chain.rpc);
            return provider.getBalance(address).then((b) => b.toString());
        }),
    );

    return balances.reduce((acc, balance, i) => {
        acc[chains[i].name] = balance;
        return acc;
    }, {});
}

/**
 * Get the deposit address for a token on a chain.
 * @param {*} env - The environment to get the deposit address for. Available options are 'local' and 'testnet'.
 * @param {*} source - The source chain object.
 * @param {*} destination - The destination chain object.
 * @param {*} destinationAddress - The destination address.
 * @param {*} symbol - The symbol of the token to get the deposit address for.
 * @returns {string} - The deposit address.
 */
function getDepositAddress(env, source, destination, destinationAddress, symbol) {
    if (env === 'testnet') {
        const listing = {
            aUSDC: 'uusdc',
        };
        const sdk = new AxelarAssetTransfer({
            environment: 'testnet',
            auth: 'local',
        });
        return sdk.getDepositAddress(source, destination, destinationAddress, listing[symbol]);
    }

    return axelarLocal.getDepositAddress(source, destination, destinationAddress, symbol, 8500);
}

async function getGasPrice(env, source, destination, tokenAddress) {
    if (env === 'local') return 1;
    if (env !== 'testnet') throw Error('env needs to be "local" or "testnet".');
    const apiUrl = 'https://devnet.api.gmp.axelarscan.io';

    const requester = axios.create({ baseURL: apiUrl });
    const params = {
        method: 'getGasPrice',
        destinationChain: destination.name,
        sourceChain: source.name,
    };

    // set gas token address to params
    if (tokenAddress !== AddressZero) {
        params.sourceTokenAddress = tokenAddress;
    } else {
        params.sourceTokenSymbol = source.tokenSymbol;
    }

    // send request
    const response = await requester.get('/', { params }).catch((error) => {
        return { data: { error } };
    });
    const result = response.data.result;
    const dest = result.destination_native_token;
    const destPrice = 1e18 * dest.gas_price * dest.token_price.usd;
    return destPrice / result.source_token.token_price.usd;
}

// Check if the wallet is set. If not, throw an error.
function checkWallet() {
    if (process.env.EVM_PRIVATE_KEY == null && process.env.EVM_MNEMONIC == null) {
        throw new Error('Need to set EVM_PRIVATE_KEY or EVM_MNEMONIC environment variable.');
    }
}

function checkEnv(env) {
    if (env == null || (env !== 'testnet' && env !== 'local')) {
        throw new Error('Need to specify testnet or local as an argument to this script.');
    }
}

function getExamplePath(exampleName) {
    const destDir = path.resolve(__dirname, '..', '..', `examples/${exampleName}/index.js`);
    return path.relative(__dirname, destDir);
}

module.exports = {
    getWallet,
    getGasPrice,
    getDepositAddress,
    getBalances,
    getChains,
    checkEnv,
    getExamplePath
};
