const { Wallet, ethers } = require('ethers');
const path = require('path');
const fs = require('fs-extra');
const { configPath } = require('../../config');
const axelarLocal = require('@axelar-network/axelar-local-dev');
const { AxelarAssetTransfer, AxelarQueryAPI, CHAINS, Environment } = require('@axelar-network/axelarjs-sdk');

/**
 * Get the wallet from the environment variables. If the EVM_PRIVATE_KEY environment variable is set, use that. Otherwise, use the EVM_MNEMONIC environment variable.
 * @returns {Wallet} - The wallet.
 */
function getWallet() {
    checkWallet();
    const privateKey = process.env.EVM_PRIVATE_KEY;
    return privateKey ? new Wallet(privateKey) : Wallet.fromMnemonic(process.env.EVM_MNEMONIC);
}

function readChainConfig(filePath) {
    if (!fs.existsSync(filePath)) {
        return undefined;
    }

    return fs.readJsonSync(filePath);
}

/**
 * Get the chain objects from the chain-config file.
 * @param {*} env - The environment to get the chain objects for. Available options are 'local' and 'testnet'.
 * @param {*} chains - The list of chains to get the chain objects for. If this is empty, the default chains will be used.
 * @returns {Chain[]} - The chain objects.
 */
function getEVMChains(env, chains = []) {
    checkEnv(env);

    const selectedChains = chains.length > 0 ? chains : getDefaultChains(env);

    if (env === 'local') {
        return fs.readJsonSync(configPath.localEvmChains).filter((chain) => selectedChains.includes(chain.name));
    }

    const testnet = getTestnetChains(selectedChains);

    return testnet.map((chain) => ({
        ...chain,
        gateway: chain.contracts.AxelarGateway.address,
        gasService: chain.contracts.AxelarGasService.address,
    }));
}

/**
 * Get chains config for testnet.
 * @param {*} chains - The list of chains to get the chain objects for. If this is empty, the default chains will be used.
 * @returns {Chain[]} - The chain objects.
 */
function getTestnetChains(chains = []) {
    const _path = path.join(__dirname, '../../chain-config/testnet-evm.json');
    let testnet = [];
    if (fs.existsSync(_path)) {
        testnet = fs
            .readJsonSync(path.join(__dirname, '../../chain-config/testnet-evm.json'))
            .filter((chain) => chains.includes(chain.name));
    }

    if (testnet.length < chains.length) {
        const { testnetInfo } = require('@axelar-network/axelar-local-dev');
        testnet = [];
        for (const chain of chains) {
            testnet.push(testnetInfo[chain.toLowerCase()]);
        }
    }

    // temporary fix for gas service contract address

    return testnet.map((chain) => ({
        ...chain,
        AxelarGasService: {
            address: '0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6',
        },
    }));
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
            const provider = new ethers.providers.JsonRpcProvider(chain.rpc);
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
            aUSDC: env === 'local' ? 'uusdc' : 'uausdc',
        };
        const sdk = new AxelarAssetTransfer({
            environment: 'testnet',
            auth: 'local',
        });
        return sdk.getDepositAddress(source, destination, destinationAddress, listing[symbol]);
    }

    return axelarLocal.getDepositAddress(source, destination, destinationAddress, symbol, 8500);
}

/**
 * Calculate the gas amount for a transaction using axelarjs-sdk.
 * @param {*} source - The source chain object.
 * @param {*} destination - The destination chain object.
 * @param {*} options - The options to pass to the estimateGasFee function. Available options are gas token symbol, gasLimit and gasMultiplier.
 * @returns {number} - The gas amount.
 */
function calculateBridgeFee(source, destination, options = {}) {
    const api = new AxelarQueryAPI({ environment: Environment.TESTNET });
    const { gasLimit, gasMultiplier, symbol } = options;

    return api.estimateGasFee(
        CHAINS.TESTNET[source.name.toUpperCase()],
        CHAINS.TESTNET[destination.name.toUpperCase()],
        symbol || source.tokenSymbol,
        gasLimit,
        gasMultiplier,
    );
}

/**
 * Calculate total gas to cover for a express transaction using axelarjs-sdk.
 * @param {*} source - The source chain object.
 * @param {*} destination - The destination chain object.
 * @param {*} options - The options to pass to the estimateGasFee function. Available options are gas token symbol, gasLimit and gasMultiplier.
 * @returns {number} - The gas amount.
 */
async function calculateBridgeExpressFee(source, destination, options = {}) {
    const api = new AxelarQueryAPI({ environment: Environment.TESTNET });
    const { gasLimit, gasMultiplier, symbol } = options;

    const response = await api.estimateGasFee(
        CHAINS.TESTNET[source.name.toUpperCase()],
        CHAINS.TESTNET[destination.name.toUpperCase()],
        symbol || source.tokenSymbol,
        gasLimit,
        gasMultiplier,
        '0',
        {
            showDetailedFees: true,
        },
    );

    const expressMultiplier = response.apiResponse.result.express_execute_gas_multiplier;

    // baseFee + executionFeeWithMultiplier + expressFee
    return ethers.BigNumber.from(response.executionFeeWithMultiplier)
        .mul(Math.ceil(expressMultiplier * 2)) // convert float to decimals
        .add(response.baseFee)
        .toString();
}

/**
 * Check if the wallet is set. If not, throw an error.
 */
function checkWallet() {
    if (process.env.EVM_PRIVATE_KEY == null && process.env.EVM_MNEMONIC == null) {
        throw new Error('Need to set EVM_PRIVATE_KEY or EVM_MNEMONIC environment variable.');
    }
}

/**
 * Check if the environment is set. If not, throw an error.
 * @param {*} env - The environment to check. Available options are 'local' and 'testnet'.
 */
function checkEnv(env) {
    if (env == null || (env !== 'testnet' && env !== 'local')) {
        throw new Error('Need to specify testnet or local as an argument to this script.');
    }
}

function getDefaultChains(env) {
    if (env === 'local') {
        return ['Avalanche', 'Fantom', 'Moonbeam', 'Polygon', 'Ethereum'];
    }

    return ['Avalanche', 'Fantom', 'Polygon'];
}

/**
 * Get the path to an example.
 * @param {*} exampleName - The name of the example to get the path for.
 * @returns {string} - The path to the example.
 */
function getExamplePath(exampleName) {
    const destDir = path.resolve(__dirname, '..', `examples/${exampleName}/index.js`);
    return path.relative(__dirname, destDir);
}

/**
 * Sanitize the event arguments.
 * This is needed because ethers.js returns the event arguments as an object with the keys being the argument names and the values being the argument values.
 * @param {*} event - The event to sanitize.
 * @returns {Object} - The sanitized event arguments.
 */
function sanitizeEventArgs(event) {
    return Object.keys(event.args).reduce((acc, key) => {
        if (isNaN(parseInt(key))) {
            acc[key] = event.args[key];
        }

        return acc;
    }, {});
}

module.exports = {
    getWallet,
    getDepositAddress,
    getBalances,
    getEVMChains,
    checkEnv,
    calculateBridgeFee,
    calculateBridgeExpressFee,
    getExamplePath,
    readChainConfig,
    sanitizeEventArgs,
};
