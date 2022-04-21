const axelar = require("@axelar-network/axelar-local-dev");
const { ethers } = require("ethers");
const { setupLocalNetwork, setupTestnetNetwork } = require("../network")
const { privateKey } = require("../secret.json")

const cliArgs = process.argv.slice(2)
const network = cliArgs[0] || 'local' // This value should be either 'local' or 'testnet'
const sendAmount = ethers.utils.parseUnits("5", 6); // the amount to send to the destination chain

// A utility function to print balance for the given address of the given token contract.
async function printBalance(alias, address, tokenContract) {
  const balance = await tokenContract.balanceOf(address);
  console.log(`${alias} has ${ethers.utils.formatUnits(balance, 6)} ${await tokenContract.symbol()}.`);
}

(async () => {
  const sender = new ethers.Wallet(privateKey)
  const receiver = sender // use the same wallet address as a recipient at the destination chain.

  const { chainA, chainB } = network === "local" ? await setupLocalNetwork(sender.address) : setupTestnetNetwork()
  const senderWithProvider = sender.connect(chainA.provider)

  console.log("\n==== Initial balances ====");
  await printBalance("sender", sender.address, chainA.ust);
  await printBalance("receiver", receiver.address, chainB.ust);

  // Approve the AxelarGateway to use our UST on chain1.
  console.log("\n==== Approve UST to gateway contract ====")
  const approveReceipt = await chainA.ust
      .connect(senderWithProvider)
      .approve(chainA.gateway.address, sendAmount)
      .then(tx => tx.wait())
  console.log("Approve tx:", approveReceipt.transactionHash)

  // Send it to the gateway contract
  console.log("\n==== Send token to the gateway contract ====");
  const receipt = await chainA.gateway
      .connect(senderWithProvider)
      .sendToken(chainB.name, receiver.address, "UST", sendAmount)
      .then(tx => tx.wait())
  console.log("sendToken Tx", receipt.transactionHash);

  if(network === "local") {
    // Relay the transfer to chainB locally.
    await axelar.relay();
  }

  console.log("\n==== After cross-chain balances ====");
  await printBalance("sender", sender.address, chainA.ust);
  await printBalance("receiver", receiver.address, chainB.ust);
})();
