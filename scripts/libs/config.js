const config = require('config');

module.exports = {
    enabledAptos: config.get('aptos.enabled'),
    enabledNear: config.get('near.enabled'),
};
