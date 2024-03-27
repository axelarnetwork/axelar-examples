const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Default configuration values
const defaults = {
    HOST: "localhost",
    PORT: "50051"
};

function getConfig() {
    const serverHOST = process.env.HOST || defaults.HOST;
    const serverPort = process.env.PORT || defaults.PORT;

    return {
        serverHOST,
        serverPort
    };
}

module.exports = getConfig;
