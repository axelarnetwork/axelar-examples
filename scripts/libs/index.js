require('dotenv').config();
require('./rootRequire');

module.exports = {
    ...require('./start'),
    ...require('./deploy'),
    ...require('./execute'),
    ...require('./utils'),
};
