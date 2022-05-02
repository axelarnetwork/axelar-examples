const uuid = require("uuid");
const { ethers } = require("ethers");
const ExampleExecutable = require("./build/ExampleExecutable.json");
const GatewayCaller = require("./build/GatewayCaller.json");
const { chainA, chainB, privateKey } = require("../env");

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
  const exampleExecutable = new ethers.Contract(
    chainB.exampleExecutable,
    ExampleExecutable.abi,
    providerChainB
  );
  const gatewayCaller = new ethers.Contract(
    chainA.gatewayCaller,
    GatewayCaller.abi,
    providerChainA
  );

  // =======================================================================
  // Step 2: Prepare payload and send transaction to GatewayCaller contract.
  // =======================================================================
  console.log("\n==== Message Before Relaying ====");
  console.log(
    `ExampleExecutable's message: "${await exampleExecutable.message()}"`
  );
  const traceId = ethers.utils.id(uuid.v4());
  const payload = ethers.utils.defaultAbiCoder.encode(
    ["bytes32", "string"],
    [traceId, `Hello from Chain A. ${new Date().toUTCString()}`]
  );

  console.log("\n==== Executing payGasAndCallContract... ====");
  const gasForDestinationContract = 1e6;
  const tx = await gatewayCaller
    .connect(sourceWalletWithProvider)
    .payGasAndCallContract(chainB.name, exampleExecutable.address, payload, {
      value: gasForDestinationContract,
    })
    .then((tx) => tx.wait());
  console.log("Tx:", tx.transactionHash);

  // =========================================================
  // Step 3: Waiting for the network to relay the transaction.
  // =========================================================
  console.log("\n==== Waiting for Relaying... ====");
  const executeEventFilter = exampleExecutable.filters.Executed(traceId);
  const relayTxHash = await new Promise((resolve) => {
    providerChainB.once(executeEventFilter, (...args) => {
      const txHash = args[args.length - 1].transactionHash;
      resolve(txHash);
    });
  });
  console.log("Relay Tx:", relayTxHash);
  // }

  // ===================================================
  // Step 6: Verify the result at the destination chain.
  // ===================================================
  console.log("\n==== Message After Relaying ====");
  console.log(
    `ExampleExecutable's message: "${await exampleExecutable.message()}"`
  );
})();
