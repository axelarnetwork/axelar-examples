const { ethers } = require("ethers");
const {
  relay,
  utils: { deployContract },
} = require("@axelar-network/axelar-local-dev");
const ExampleExecutable = require("./build/ExampleExecutable.json");
const GatewayCaller = require("./build/GatewayCaller.json");
const { setupLocalNetwork, setupTestnetNetwork } = require("../network");
const { privateKey } = require("../secret.json");

const cliArgs = process.argv.slice(2);
const network = cliArgs[0] || "local"; // This value should be either 'local' or 'testnet'

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

  // =======================================================================
  // Step 4: Prepare payload and send transaction to GatewayCaller contract.
  // =======================================================================
  console.log("\n==== Message Before Relaying ====");
  console.log(
    `ExampleExecutable's message: "${await exampleExecutable.message()}"`
  );
  const traceId = ethers.utils.id(uuid.v4());
  const payload = ethers.utils.defaultAbiCoder.encode(
    ["bytes32", "string"],
    [traceId, "Hello from Chain A."]
  );

  const gasForDestinationContract = 1e6;
  await gatewayCaller
    .connect(sourceWalletWithProvider)
    .payGasAndCallContract(chainB.name, exampleExecutable.address, payload, {
      value: gasForDestinationContract,
    })
    .then((tx) => tx.wait());

  // =========================================================
  // Step 5: Waiting for the network to relay the transaction.
  // =========================================================
  console.log("\n==== Waiting for Relaying... ====");
  if (network === "local") {
    await relay();
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
  // Step 6: Verify the result at the destination chain.
  // ===================================================
  console.log("\n==== Message After Relaying ====");
  console.log(
    `ExampleExecutable's message: "${await exampleExecutable.message()}"`
  );
})();
