"use strict";

const {
  createNetwork: createChain,
  relay,
  getGasPrice,
  utils: { deployContract },
} = require("@axelar-network/axelar-local-dev");
const {
  constants: { AddressZero },
  ethers,
} = require("ethers");

const HelloExecutable = require("../../build/HelloExecutable.json");

(async () => {
  // Create two chains and get a funded user for each
  console.log("\n==== Chains and contracts setup ====")
  const chain1 = await createChain({ seed: "chain1" });
  const [user1] = chain1.userWallets;
  const chain2 = await createChain({ seed: "chain2" });
  const [user2] = chain2.userWallets;

  const chain1HelloContract = await deployContract(user1, HelloExecutable, [
    chain1.gateway.address,
    chain1.gasReceiver.address,
  ]);

  const chain2HelloContract = await deployContract(user2, HelloExecutable, [
    chain2.gateway.address,
    chain2.gasReceiver.address,
  ]);
  console.log(chain1HelloContract.address, chain2HelloContract.address);

  console.log("\n==== User Addresses ====");
  console.log("user1 address:", user1.address);
  console.log("user2 address:", user2.address);

  // This is used for logging.
  const print = async () => {
    console.log(`Message at ${chain1.name}: "${await chain1HelloContract.message()}"`);
    console.log(`Message at ${chain2.name}: "${await chain2HelloContract.message()}"`);
  };

  console.log("\n==== Message Before Relaying ====");
  await print();

  // Set the value on chain1. This will also cause the value on chain2 to change after relay() is called.
  const msgFromUser1 = ethers.utils.defaultAbiCoder.encode(
    ["string"],
    ["Hello from: " + user1.address]
  );
  const msgFromUser2 = ethers.utils.defaultAbiCoder.encode(
    ["string"],
    ["Hello from: " + user2.address]
  );

  await chain1HelloContract
    .connect(user1)
    .payGasAndCallContract(
      chain2.name,
      chain2HelloContract.address,
      msgFromUser1,
      {
        value: "50000000",
      }
    )
    .then((tx) => tx.wait());

  await chain2HelloContract
    .connect(user2)
    .payGasAndCallContract(
      chain1.name,
      chain1HelloContract.address,
      msgFromUser2,
      {
        value: "50000000",
      }
    )
    .then((tx) => tx.wait());

  await relay();

  console.log("\n==== Message After Relaying ====");
  await print();
})();
