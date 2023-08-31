const config = require('config');

module.exports = {
    enabledAptos: config.get('aptos.enabled'),
    enabledSui: config.get('sui.enabled'),
};
