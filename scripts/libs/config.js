const config = require('config');

module.exports = {
    enabledCosmos: config.get('cosmos.enabled'),
};
