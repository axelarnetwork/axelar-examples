const {createAndExport} = require('@axelar-network/axelar-local-dev')
const { ethers } = require('ethers')
const {privateKey} = require("../secret.json")

const wallet = new ethers.Wallet(privateKey)

const options = {
  chainOutputPath: "./local.json",
  accountsToFund: [wallet.address],
  fundAmount: ethers.utils.parseEther('100').toString(),
  chains: ["moonbeam", "avalanche"],
  port: 8500,
  relayInterval: 2000
}

createAndExport(options)
