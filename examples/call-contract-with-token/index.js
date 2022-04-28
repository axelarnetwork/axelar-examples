const {
  deployContract,
} = require("@axelar-network/axelar-local-dev/dist/utils");
const axelar = require("@axelar-network/axelar-local-dev");
const erc20 = require("./build/ERC20.json");
const { ethers } = require("ethers");
const uuid = require("uuid");
const ExampleExecutable = require("./build/ExampleExecutable.json");
const GatewayCaller = require("./build/GatewayCaller.json");
const { privateKey } = require("../../secret.json");
const cliArgs = process.argv.slice(2);
const network = cliArgs[0] || "local"; // This value should be either 'local' or 'testnet'
const { chainA, chainB } =
  network === "testnet"
    ? require("../../chain-testnet.json")
    : require("../../chain-local.json");

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

// Create multiple recipients
const recipientAddresses = generateWalletAddresses(5); // generate random wallet addresses.
const aliases = recipientAddresses.map(
  (_, i) => `[Chain B] destination wallet ${i + 1}:`
); // recipient wallets aliases used for logging.
const sendAmount = ethers.utils.parseUnits("1.2", 6); // ust amount to be sent

(async () => {
  if (!chainA.gatewayCaller || !chainB.exampleExecutable)
    return console.log("Run deploy script first.");

  // ========================================================
  // Step 1: Setup wallet and connect with the chain provider
  // ========================================================
  const providerChainA = new ethers.providers.JsonRpcProvider(chainA.provider);
  const providerChainB = new ethers.providers.JsonRpcProvider(chainB.provider);

  const sourceWallet = new ethers.Wallet(privateKey);
  const sourceWalletWithProvider = sourceWallet.connect(providerChainA);

  const ustChainA = new ethers.Contract(chainA.ust, erc20.abi, providerChainA);
  const ustChainB = new ethers.Contract(chainB.ust, erc20.abi, providerChainB);
  const gatewayCaller = new ethers.Contract(
    chainA.gatewayCaller,
    GatewayCaller.abi,
    providerChainA
  );
  const exampleExecutable = new ethers.Contract(
    chainB.exampleExecutable,
    ExampleExecutable.abi,
    providerChainB
  );

  // =====================================================================
  // Step 2: Approve the GatewayCaller contract to use the UST on chain A.
  // =====================================================================
  await ustChainA
    .connect(sourceWalletWithProvider)
    .approve(chainA.gatewayCaller, sendAmount)
    .then((tx) => tx.wait());

  // =======================================================================
  // Step 3: Prepare payload and send transaction to GatewayCaller contract.
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
  // Step 4: Waiting for the network to relay the transaction.
  // =========================================================
  if (network === "local") {
    await axelar.relay();
  } else {
    console.log("\n==== Waiting for Relaying... ====");
    const executeEventFilter = exampleExecutable.filters.Executed(traceId);
    const relayTxHash = await new Promise((resolve) => {
      providerChainB.once(executeEventFilter, (...args) => {
        const txHash = args[args.length - 1].transactionHash;
        resolve(txHash);
      });
    });
    console.log("Relay Tx:", relayTxHash);
  }

  // ===================================================
  // Step 5: Verify the result at the destination chain.
  // ===================================================
  console.log("\n==== After cross-chain balances ====");
  await printBalance(
    "[Chain A] source wallet",
    sourceWallet.address,
    ustChainA
  );
  await printMultipleBalances(aliases, recipientAddresses, ustChainB);
})();
