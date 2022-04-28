const { ethers } = require("ethers");
const axelar = require("@axelar-network/axelar-local-dev");
const Erc20 = require("../call-contract-with-token/build/ERC20.json");
const Gateway = require("../call-contract-with-token/build/IAxelarGateway.json");
const { privateKey } = require("../../secret.json");
const cliArgs = process.argv.slice(2);
const network = cliArgs[0] || "local"; // This value should be either 'local' or 'testnet'
const { chainA, chainB } =
  network === "testnet"
    ? require("../../chain-testnet.json")
    : require("../../chain-local.json");
const sendAmount = ethers.utils.parseUnits("1", 6); // the amount to send to the destination chain

// A utility function to print balance for the given address of the given token contract.
async function printBalance(alias, address, tokenContract) {
  const balance = await tokenContract.balanceOf(address);
  console.log(`${alias} has ${ethers.utils.formatUnits(balance, 6)} UST`);
}

(async () => {
  // =========================================================
  // Step 1: Setup wallet and connect with the chain provider
  // =========================================================
  const sender = new ethers.Wallet(privateKey);
  const receiver = sender; // use the same wallet address as a recipient at the destination chain.
  const providerChainA = new ethers.providers.JsonRpcProvider(chainA.provider);
  const providerChainB = new ethers.providers.JsonRpcProvider(chainB.provider);
  const senderWithProvider = sender.connect(providerChainA);
  const gateway = new ethers.Contract(
    chainA.gateway,
    Gateway.abi,
    providerChainA
  );
  const ustChainA = new ethers.Contract(chainA.ust, Erc20.abi, providerChainA);
  const ustChainB = new ethers.Contract(chainB.ust, Erc20.abi, providerChainB);

  console.log("\n==== Initial balances ====");
  await printBalance("sender", sender.address, ustChainA);
  await printBalance("receiver", receiver.address, ustChainB);

  // ===========================================================
  // Step 2: Approve the AxelarGateway to use our UST on chain A.
  // ===========================================================
  console.log("\n==== Approve UST to gateway contract ====");
  const approveReceipt = await ustChainA
    .connect(senderWithProvider)
    .approve(chainA.gateway, sendAmount)
    .then((tx) => tx.wait());
  console.log("Approve tx:", approveReceipt.transactionHash);

  // ==========================================================
  // Step 3: Send a transaction to call sendToken function at AxelarGateway contract.
  // ==========================================================
  console.log("\n==== Send token to the gateway contract ====");
  const receipt = await gateway
    .connect(senderWithProvider)
    .sendToken(chainB.name, receiver.address, "UST", sendAmount)
    .then((tx) => tx.wait());
  console.log("sendToken Tx", receipt.transactionHash);

  // ===========================================================
  // Step 4: Waiting for the network to relay the transaction.
  // ===========================================================
  if (network === "local") {
    await axelar.relay();
  } else {
    console.log("\n==== Waiting for Relaying... ====");
    const eventFilter = ustChainB.filters.Transfer(
      ethers.constants.AddressZero,
      receiver.address
    );
    const relayTxHash = await new Promise((resolve) => {
      providerChainB.once(eventFilter, (...args) => {
        const txHash = args[args.length - 1].transactionHash;
        resolve(txHash);
      });
    });
    console.log("Relay Tx:", relayTxHash);
  }

  // ===========================================================
  // Step 5: Verify the result at the destination chain
  // ===========================================================
  console.log("\n==== After cross-chain balances ====");
  await printBalance("sender", sender.address, ustChainA);
  await printBalance("receiver", receiver.address, ustChainB);
})();
