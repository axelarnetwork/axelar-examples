const axelar = require("@axelar-network/axelar-local-dev");
const { ethers } = require("ethers");
const { generateWalletAddresses } = require("./utils/generator");
const { printMultipleBalances, printBalance } = require("./utils/logger");
const distributionExecutorAbi = require("../build/DistributionExecutor.json");
const {
  deployContract,
} = require("@axelar-network/axelar-local-dev/dist/utils");

// Create multiple recipients
const recipientAddresses = generateWalletAddresses(5);
const alias = recipientAddresses.map((_, i) => `Recipient${i + 1}`);
const fundAmount = ethers.utils.parseUnits("1000", 6);
const sendAmount = ethers.utils.parseUnits("100", 6);

(async () => {
  console.log("==== Preparing chain1... ====");
  const chain1 = await axelar.createNetwork({ seed: "chain1" });
  const [sender] = chain1.userWallets;
  console.log("\n==== Preparing chain2... ====");
  const chain2 = await axelar.createNetwork({ seed: "chain2" });
  const [deployer] = chain2.userWallets;

  // Deploy DistributionExecutor contract
  console.log("\n==== Deploying DistributionExecutor contract... ====");
  const distributionContract = await deployContract(
    deployer,
    distributionExecutorAbi,
    [chain2.gateway.address]
  );
  console.log("Deployed:", distributionContract.address);

  // Fund sender account with 1000 UST
  await chain1.giveToken(sender.address, "UST", fundAmount);

  console.log("\n==== Initial balances ====");
  await printBalance("Sender", sender.address, chain1.ust);
  await printMultipleBalances(alias, recipientAddresses, chain2.ust);

  // Approve the AxelarGateway to use our UST on chain1.
  await (
    await chain1.ust.connect(sender).approve(chain1.gateway.address, sendAmount)
  ).wait();

  console.log("\n==== Calling the gateway contract ====");

  // Send a transaction to the gateway contract to call `callContractWithToken` function.
  const payload = ethers.utils.defaultAbiCoder.encode(
    ["address[]"],
    [recipientAddresses]
  );
  const tx = await chain1.gateway
    .connect(sender)
    .callContractWithToken(
      chain2.name,
      distributionContract.address,
      payload,
      "UST",
      sendAmount
    )
    .then((tx) => tx.wait());

  console.log("Tx:", tx.transactionHash);

  // Relay a transaction to the destination chain
  await axelar.relay();

  console.log("\n==== After cross-chain balances ====");
  await printBalance("Sender", sender.address, chain1.ust);
  await printMultipleBalances(alias, recipientAddresses, chain2.ust);
})();
