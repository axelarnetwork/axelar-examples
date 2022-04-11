const axelar = require("@axelar-network/axelar-local-dev");
const {
  deployContract,
} = require("@axelar-network/axelar-local-dev/dist/utils");
const { AxelarGateway } = require("@axelar-network/axelarjs-sdk");
const { ethers } = require("ethers");
const distributionExecutorAbi = require("../build/DistributionExecutor.json");

// Create 5 recipients
const recipientAddresses = new Array(5)
  .fill(0)
  .map(() => ethers.Wallet.createRandom().address);

async function logUstBalances(addresses, tokenContract) {
  for (let i = 0; i < addresses.length; i++) {
    console.log(
      `Recipient${i + 1} has ${await getFormattedUst(
        addresses[i],
        tokenContract
      )} UST`
    );
  }
}

async function getFormattedUst(address, tokenContract) {
  const amount = await tokenContract.balanceOf(address);
  return ethers.utils.formatUnits(amount, 6);
}

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

  await chain1.giveToken(sender.address, "UST", 1000 * 1e6);

  console.log("\n==== Initial balances ====");
  console.log(
    `Sender has ${await getFormattedUst(sender.address, chain1.ust)} UST`
  );
  await logUstBalances(recipientAddresses, chain1.ust);

  // Approve the AxelarGateway to use our UST on chain1.
  const amount = ethers.utils.parseUnits("100", 6);
  await (
    await chain1.ust.connect(sender).approve(chain1.gateway.address, amount)
  ).wait();

  // And have it send it to chain2.
  // const gateway = new AxelarGateway(chain1.gateway.address, chain1.provider);
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
      amount
    )
    .then((tx) => tx.wait());
  console.log("Send tx to gateway:", tx.transactionHash);

  await axelar.relay();

  console.log("\n==== After cross-chain balances ====");
  console.log(
    `Sender has ${await getFormattedUst(sender.address, chain1.ust)} UST`
  );
  await logUstBalances(recipientAddresses, chain2.ust);
})();
