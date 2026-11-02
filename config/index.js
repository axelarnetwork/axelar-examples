const path = require('path');

const configPath = {
    localEvmChains: path.resolve(__dirname, '..', 'chain-config', 'local-evm.json'),
    localCosmosChains: path.resolve(__dirname, '..', 'chain-config', 'local-cosmos.json'),
    localSuiChains: path.resolve(__dirname, '..', 'chain-config', 'local-sui.json'),
};

module.exports = {
    configPath,
};
