const { ethers } = require("ethers");

async function printBalance(alias, address, tokenContract) {
  const balance = await tokenContract.balanceOf(address);
  console.log(`${alias} has ${ethers.utils.formatUnits(balance, 6)} UST.`);
}

async function printMultipleBalances(aliases, addresses, tokenContract) {
  for (let i = 0; i < addresses.length; i++) {
    printBalance(aliases[i], addresses[i], tokenContract);
  }
}

module.exports = {
  printBalance,
  printMultipleBalances,
};
