const axelar = require("@axelar-network/axelar-local-dev");
const { ethers } = require("ethers");
const distributionExecutableAbi = require("../../build/DistributionExecutable.json");
const {
  deployContract,
} = require("@axelar-network/axelar-local-dev/dist/utils");
const {privateKey} = '../../secret.json'

function generateWalletAddresses(numberOfWallets) {
  return new Array(numberOfWallets)
    .fill(0)
    .map(() => ethers.Wallet.createRandom().address);
}

async function printMultipleBalances(aliases, addresses, tokenContract) {
  for (let i = 0; i < addresses.length; i++) {
    printBalance(aliases[i], addresses[i], tokenContract);
  }
}

async function printBalance(alias, address, tokenContract) {
  const balance = await tokenContract.balanceOf(address);
  console.log(`${alias} has ${ethers.utils.formatUnits(balance, 6)} UST.`);
}

// Create multiple recipients
const recipientAddresses = generateWalletAddresses(5);
const alias = recipientAddresses.map((_, i) => `chain2Recipient${i + 1}`);
const fundAmount = ethers.utils.parseUnits("1000", 6);
const sendAmount = ethers.utils.parseUnits("100", 6);


(async () => {
  console.log("==== Preparing chain1... ====");
  const chain1 = await axelar.createNetwork({ seed: "chain1" });
  const [chain1Sender, chain1Deployer] = chain1.userWallets;
  console.log("\n==== Preparing chain2... ====");
  const chain2 = await axelar.createNetwork({ seed: "chain2" });
  const [chain2Deployer] = chain2.userWallets;

  // Deploy DistributionExecutor contract on the source chain.
  console.log("\n==== Deploying DistributionExecutor contract on the destination chain... ====");
  const sourceDistributionContract = await deployContract(
    chain1Deployer,
    distributionExecutableAbi,
    [chain1.gateway.address, chain1.gasReceiver.address]
  );
  console.log("Deployed:", sourceDistributionContract.address);

  // Deploy DistributionExecutor contract on the destination chain.
  console.log("\n==== Deploying DistributionExecutor contract on the destination chain... ====");
  const destinationDistributionContract = await deployContract(
    chain2Deployer,
    distributionExecutableAbi,
    [chain2.gateway.address, chain2.gasReceiver.address]
  );
  console.log("Deployed:", destinationDistributionContract.address);

  // Fund sender account with 1000 UST
  await chain1.giveToken(chain1Sender.address, "UST", fundAmount);

  console.log("\n==== Initial balances ====");
  await printBalance("chain1Sender", chain1Sender.address, chain1.ust);
  await printMultipleBalances(alias, recipientAddresses, chain2.ust);

  // Approve the AxelarGateway to use our UST on chain1.
  await (
    await chain1.ust
      .connect(chain1Sender)
      .approve(sourceDistributionContract.address, sendAmount)
  ).wait();

  console.log("\n==== Calling the gateway contract ====");

  // Send a transaction to the gateway contract to call `callContractWithToken` function.
  const payload = ethers.utils.defaultAbiCoder.encode(
    ["address[]"],
    [recipientAddresses]
  );
  const tx = await sourceDistributionContract
    .connect(chain1Sender)
    .payGasAndCallContractWithToken(
      chain2.name,
      destinationDistributionContract.address,
      payload,
      "UST",
      sendAmount,
      {value: 1e6}
    )
    .then((tx) => tx.wait());

  console.log("Tx:", tx.transactionHash);

  // Relay a transaction to the destination chain
  await axelar.relay();

  console.log("\n==== After cross-chain balances ====");
  await printBalance("chain1Sender", chain1Sender.address, chain1.ust);
  await printMultipleBalances(alias, recipientAddresses, chain2.ust);
})();
