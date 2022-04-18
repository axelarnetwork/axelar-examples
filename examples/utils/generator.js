const { ethers } = require("ethers");

function generateWalletAddresses(numberOfWallets) {
  return new Array(numberOfWallets)
    .fill(0)
    .map(() => ethers.Wallet.createRandom().address);
}

module.exports = {
  generateWalletAddresses,
};
