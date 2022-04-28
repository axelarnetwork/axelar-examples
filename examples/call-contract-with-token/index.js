const {
  deployContract,
} = require("@axelar-network/axelar-local-dev/dist/utils");
const axelar = require("@axelar-network/axelar-local-dev");
const { ethers } = require("ethers");
const uuid = require("uuid");
const ExampleExecutable = require("./build/ExampleExecutable.json");
const GatewayCaller = require("./build/GatewayCaller.json");
const { setupLocalNetwork, setupTestnetNetwork } = require("../network");
const { privateKey } = require("../secret.json");

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
  console.log(
    `${alias} has ${ethers.utils.formatUnits(
      balance,
      6
    )} ${await tokenContract.symbol()}.`
  );
}

const cliArgs = process.argv.slice(2);
const network = cliArgs[0] || "local"; // This value should be either 'local' or 'testnet'

// Create multiple recipients
const recipientAddresses = generateWalletAddresses(5); // generate random wallet addresses.
const aliases = recipientAddresses.map(
  (_, i) => `[Chain B] destination wallet ${i + 1}:`
); // recipient wallets aliases used for logging.
const sendAmount = ethers.utils.parseUnits("1.2", 6); // ust amount to be sent

(async () => {
  // ========================================================
  // Step 1: Setup wallet and connect with the chain provider
  // ========================================================
  const sourceWallet = new ethers.Wallet(privateKey);
  const { chainA, chainB } =
    network === "testnet"
      ? setupTestnetNetwork()
      : await setupLocalNetwork(sourceWallet.address);

  const sourceWalletWithProvider = sourceWallet.connect(chainA.provider);
  const destinationWalletWithProvider = sourceWallet.connect(chainB.provider);

  // ==============================================================
  // Step 2: Deploy the GatewayCaller contract at the source chain.
  // ==============================================================
  console.log("\n==== Deploying contracts... ====");
  const gatewayCaller = await deployContract(
    sourceWalletWithProvider,
    GatewayCaller,
    [chainA.gateway.address, chainA.gasReceiver.address]
  );
  console.log("GatewayCaller is deployed at:", gatewayCaller.address);

  // =======================================================================
  // Step 3: Deploy the ExampleExecutable contract at the destination chain.
  // =======================================================================
  const exampleExecutable = await deployContract(
    destinationWalletWithProvider,
    ExampleExecutable,
    [chainB.gateway.address]
  );
  console.log("ExampleExecutable is deployed at:", exampleExecutable.address);

  console.log("\n==== Initial balances ====");
  await printBalance(
    "[Chain A] source wallet",
    sourceWallet.address,
    chainA.ust
  );
  await printMultipleBalances(aliases, recipientAddresses, chainB.ust);

  // =====================================================================
  // Step 4: Approve the GatewayCaller contract to use the UST on chain A.
  // =====================================================================
  await chainA.ust
    .connect(sourceWalletWithProvider)
    .approve(gatewayCaller.address, sendAmount)
    .then((tx) => tx.wait());

  // =======================================================================
  // Step 5: Prepare payload and send transaction to GatewayCaller contract.
  // =======================================================================
  console.log("\n==== Calling the GatewayCaller contract ====");
  const traceId = ethers.utils.id(uuid.v4());
  const payload = ethers.utils.defaultAbiCoder.encode(
    ["bytes32", "address[]"],
    [traceId, recipientAddresses]
  );
  const gasForDestinationContract = 1e6;
  const tx = await gatewayCaller
    .connect(sourceWalletWithProvider)
    .payGasAndCallContractWithToken(
      chainB.name,
      exampleExecutable.address,
      payload,
      "UST",
      sendAmount,
      { value: gasForDestinationContract }
    )
    .then((tx) => tx.wait());

  console.log("Tx:", tx.transactionHash);

  // =========================================================
  // Step 6: Waiting for the network to relay the transaction.
  // =========================================================
  console.log("\n==== Waiting for Relaying... ====");
  if (network === "local") {
    await axelar.relay();
  } else {
    const executeEventFilter = exampleExecutable.filters.Executed(traceId);
    const relayTxHash = await new Promise((resolve) => {
      chainB.provider.once(executeEventFilter, (...args) => {
        const txHash = args[args.length - 1].transactionHash;
        resolve(txHash);
      });
    });
    console.log("Relay Tx:", relayTxHash);
  }

  // ===================================================
  // Step 7: Verify the result at the destination chain.
  // ===================================================
  console.log("\n==== After cross-chain balances ====");
  await printBalance(
    "[Chain A] source wallet",
    sourceWallet.address,
    chainA.ust
  );
  await printMultipleBalances(aliases, recipientAddresses, chainB.ust);
})();
