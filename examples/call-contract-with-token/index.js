const {
  deployContract,
} = require("@axelar-network/axelar-local-dev/dist/utils");
const axelar = require("@axelar-network/axelar-local-dev");
const { ethers } = require("ethers");
const ExampleExecutable = require("./build/ExampleExecutable.json");
const GatewayCaller = require("./build/GatewayCaller.json");
const { setupLocalNetwork, setupTestnetNetwork } = require("../network")
const {privateKey} = require('../secret.json')

function generateWalletAddresses(numberOfWallets) {
  return new Array(numberOfWallets)
    .fill(0)
    .map(() => ethers.Wallet.createRandom().address);
}

async function printMultipleBalances(aliases, addresses, tokenContract) {
  for (let i = 0; i < addresses.length; i++) {
    await printBalance(aliases[i], addresses[i], tokenContract);
  }
}

async function printBalance(alias, address, tokenContract) {
  const balance = await tokenContract.balanceOf(address);
  console.log(`${alias} has ${ethers.utils.formatUnits(balance, 6)} ${await tokenContract.symbol()}.`);
}

const cliArgs = process.argv.slice(2)
const network = cliArgs[0] || 'local' // This value should be either 'local' or 'testnet'

// Create multiple recipients
const recipientAddresses = generateWalletAddresses(5);
const aliases = recipientAddresses.map((_, i) => `[Chain B] destination wallet ${i + 1}:`);
const sendAmount = ethers.utils.parseUnits("5", 6);

(async () => {
  const sourceWallet = new ethers.Wallet(privateKey)
  const {chainA, chainB} = network === 'local' ? await setupLocalNetwork(sourceWallet.address) : setupTestnetNetwork()
  const sourceWalletWithProvider = sourceWallet.connect(chainA.provider)
  const destinationWalletWithProvider = sourceWallet.connect(chainB.provider)

   // Deploy DistributionExecutor contract on the source chain.
  console.log("\n==== Deploying contracts... ====");
  const gatewayCaller = await deployContract(
    sourceWalletWithProvider,
    GatewayCaller,
    [chainA.gateway.address, chainA.gasReceiver.address]
  );
  console.log("GatewayCaller is deployed at:", gatewayCaller.address);

  const exampleExecutable = await deployContract(
    destinationWalletWithProvider,
    ExampleExecutable,
    [chainB.gateway.address]
  );

  console.log("ExampleExecutable is deployed at:", exampleExecutable.address);

  console.log("\n==== Initial balances ====");
  await printBalance("[Chain A] source wallet", sourceWallet.address, chainA.ust);
  await printMultipleBalances(aliases, recipientAddresses, chainB.ust);

  // Approve the GatewayCaller to use our UST on chain A.
    await chainA.ust
      .connect(sourceWalletWithProvider)
      .approve(gatewayCaller.address, sendAmount)
      .then(tx => tx.wait())

  console.log("\n==== Calling the GatewayCaller contract ====");

  // Send a transaction to the gateway contract to call `callContractWithToken` function.
  const payload = ethers.utils.defaultAbiCoder.encode(
    ["address[]"],
    [recipientAddresses]
  );

  const gasForDestinationContract = 1e6
  const tx = await gatewayCaller
    .connect(sourceWalletWithProvider)
    .payGasAndCallContractWithToken(
      chainB.name,
      exampleExecutable.address,
      payload,
      "UST",
      sendAmount,
      {value: gasForDestinationContract}
    )
    .then((tx) => tx.wait());

  console.log("Tx:", tx.transactionHash);

  // Relay a transaction to the destination chain
  if(network === 'local') {
    await axelar.relay();
  } else {
    // waiting for the event
  }

  console.log("\n==== After cross-chain balances ====");
  await printBalance("[Chain A] source wallet", sourceWallet.address, chainA.ust);
  await printMultipleBalances(aliases, recipientAddresses, chainB.ust);
})();
