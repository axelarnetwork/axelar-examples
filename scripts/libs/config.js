const config = require('config');

module.exports = {
    enabledCosmos: config.get('cosmos.enabled'),
    enabledSui: config.get('sui.enabled'),
};
