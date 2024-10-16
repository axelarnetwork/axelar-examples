const fs = require('fs');
const https = require('https');
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

const chainsConfigFile = JSON.parse(fs.readFileSync('./examples/amplifier/config/chains.json', 'utf8'));
const environment = process.env.ENVIRONMENT;
const chainsConfig = chainsConfigFile[environment];

function getConfig() {
    const serverHOST = process.env.HOST || defaults.HOST;
    const serverPort = process.env.PORT || defaults.PORT;

    const gmpAPIURL = process.env.GMP_API_URL || defaults.GMP_API_URL;

    return {
        serverHOST,
        serverPort,
        gmpAPIURL,
        chains: chainsConfig,
        httpsAgent: new https.Agent({
            cert,
            key,
            rejectUnauthorized: false,
        }),
    };
}

function getChainConfig(chainName) {
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
