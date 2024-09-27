const fs = require('fs');

const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Load the certificate and key
const cert = fs.readFileSync(process.env.CRT_PATH);
const key = fs.readFileSync(process.env.KEY_PATH);

// Default configuration values
const defaults = {
    // gRPC
    HOST: 'localhost',
    PORT: '50051',

    // GMP API
    GMP_API_URL: 'http://localhost:8080',
};

const chains = {
    'avalanche-fuji': {
        rpcUrl: 'https://rpc.ankr.com/avalanche_fuji',
        externalGateway: '0xF128c84c3326727c3e155168daAa4C0156B87AD1',
        id: 'avalanche-fuji',
    },
    'xrpl-evm-sidechain': {
        rpcUrl: '',
        externalGateway: '',
        id: 'xrpl-evm-sidechain',
    },
};

function getConfig() {
    const serverHOST = process.env.HOST || defaults.HOST;
    const serverPort = process.env.PORT || defaults.PORT;

    const gmpAPIURL = process.env.GMP_API_URL || defaults.GMP_API_URL;

    return {
        serverHOST,
        serverPort,
        gmpAPIURL,
        chains,
        cert,
        key,
    };
}

const chainsConfigFile = './examples/amplifier/chains.json';

function getChainConfig(chainName) {
    const chainsConfig = JSON.parse(fs.readFileSync(chainsConfigFile, 'utf8'));

    const chainConfig = chainsConfig.find((c) => c.name === chainName);

    if (!chainConfig) {
        throw new Error(`RPC URL not found for chain: ${chainName}`);
    }

    return chainConfig;
}

module.exports = {
    getConfig,
    getChainConfig,
};
