const { privateKey } = require("../secret.json");

const cliArgs = process.argv.slice(2);
const network = cliArgs[0] || "local"; // This value should be either 'local' or 'testnet' (default to local)
const config =
  network === "testnet"
    ? require("../chain-testnet.json")
    : require("../chain-local.json");

module.exports = {
  chainA: config.chainA,
  chainB: config.chainB,
  privateKey,
};
