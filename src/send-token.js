const axelar = require("@axelar-network/axelar-local-dev");
const { ethers } = require("ethers");
const { printBalance } = require("./utils/logger");

const fundAmount = ethers.utils.parseUnits("1000", 6);
const sendAmount = ethers.utils.parseUnits("100", 6);

(async () => {
  console.log("==== Preparing chain1... ====");
  const chain1 = await axelar.createNetwork();
  const [chain1User] = chain1.userWallets;
  console.log("\n==== Preparing chain2... ====");
  const chain2 = await axelar.createNetwork();
  const [chain2User] = chain2.userWallets;

  await chain1.giveToken(chain1User.address, "UST", fundAmount);

  console.log("\n==== Initial balances ====");
  await printBalance("chain1User", chain1User.address, chain1.ust);
  await printBalance("chain2User", chain2User.address, chain2.ust);

  // Approve the AxelarGateway to use our UST on chain1.
  await (
    await chain1.ust.connect(chain1User).approve(chain1.gateway.address, sendAmount)
  ).wait();

  // Send it to the gateway contract
  console.log("\n==== Send token to the gateway contract ====");
  const receipt = await (
    await chain1.gateway
      .connect(chain1User)
      .sendToken(chain2.name, chain2User.address, "UST", sendAmount)
  ).wait();
  console.log("Tx", receipt.transactionHash);

  // Have axelar relay the tranfer to chain2.
  await axelar.relay();

  console.log("\n==== After cross-chain balances ====");
  await printBalance("chain1User", chain1User.address, chain1.ust);
  await printBalance("chain2User", chain2User.address, chain2.ust);
})();
