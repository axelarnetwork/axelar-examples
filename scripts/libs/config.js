const config = require('config');

module.exports = {
    enabledCosmos: config.get('cosmos.enabled'),
    enabledMultiversx: config.get('multiversx.enabled'),
};
