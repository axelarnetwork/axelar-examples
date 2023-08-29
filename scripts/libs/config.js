const config = require('config');

module.exports = {
    enabledAptos: config.get('aptos.enabled'),
    enabledMultiversx: config.get('multiversx.enabled'),
};
