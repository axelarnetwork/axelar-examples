const {
  deployContract,
} = require("@axelar-network/axelar-local-dev/dist/utils");
const fs = require("fs");
const { ethers } = require("ethers");
const ExampleExecutable = require("./build/ExampleExecutable.json");
const GatewayCaller = require("./build/GatewayCaller.json");
const { privateKey } = require("../../secret.json");
const cliArgs = process.argv.slice(2);
const network = cliArgs[0] || "local"; // This value should be either 'local' or 'testnet'
const chainConfigFile =
  network === "testnet" ? "chain-testnet.json" : "chain-local.json";
const { chainA, chainB } = require(`../../${chainConfigFile}`);

(async () => {
  // ========================================================
  // Step 1: Setup wallet and connect with the chain provider
  // ========================================================
  const sourceWallet = new ethers.Wallet(privateKey);
  const providerChainA = new ethers.providers.JsonRpcProvider(chainA.provider);
  const providerChainB = new ethers.providers.JsonRpcProvider(chainB.provider);
  const sourceWalletWithProvider = sourceWallet.connect(providerChainA);
  const destinationWalletWithProvider = sourceWallet.connect(providerChainB);

  // ==============================================================
  // Step 2: Deploy the GatewayCaller contract at the source chain.
  // ==============================================================
  const gatewayCaller = await deployContract(
    sourceWalletWithProvider,
    GatewayCaller,
    [chainA.gateway, chainA.gasReceiver]
  );
  console.log("GatewayCaller is deployed at:", gatewayCaller.address);

  // =======================================================================
  // Step 3: Deploy the ExampleExecutable contract at the destination chain.
  // =======================================================================
  const exampleExecutable = await deployContract(
    destinationWalletWithProvider,
    ExampleExecutable,
    [chainB.gateway]
  );
  console.log("ExampleExecutable is deployed at:", exampleExecutable.address);

  chainA.gatewayCallerWithToken = gatewayCaller.address;
  chainB.exampleExecutableWithToken = exampleExecutable.address;

  fs.writeFileSync(
    chainConfigFile,
    JSON.stringify({ chainA, chainB }, null, 2)
  );
})();
