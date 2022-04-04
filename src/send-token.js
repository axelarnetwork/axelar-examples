const axelar = require("@axelar-network/axelar-local-dev");

(async () => {
  console.log("==== Preparing chain1... ====");
  const chain1 = await axelar.createNetwork();
  const [user1] = chain1.userWallets;
  console.log("\n==== Preparing chain2... ====");
  const chain2 = await axelar.createNetwork();
  const [user2] = chain2.userWallets;

  await chain1.giveToken(user1.address, "UST", 1000);

  console.log("\n==== Initial balances ====");
  console.log(`user1 has ${await chain1.ust.balanceOf(user1.address)} UST.`);
  console.log(`user2 has ${await chain2.ust.balanceOf(user2.address)} UST.`);

  // Approve the AxelarGateway to use our UST on chain1.
  await (
    await chain1.ust.connect(user1).approve(chain1.gateway.address, 100)
  ).wait();
  // And have it send it to chain2.
  await (
    await chain1.gateway
      .connect(user1)
      .sendToken(chain2.name, user2.address, "UST", 100)
  ).wait();
  // Have axelar relay the tranfer to chain2.
  await axelar.relay();

  console.log("\n==== After cross-chain balances ====");
  console.log(`user1 has ${await chain1.ust.balanceOf(user1.address)} UST.`);
  console.log(`user2 has ${await chain2.ust.balanceOf(user2.address)} UST.`);
})();
