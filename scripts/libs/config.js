const config = require('config');

module.exports = {
    enabledAptos: config.get('aptos.enabled'),
    enabledCosmos: config.get('cosmos.enabled'),
};
