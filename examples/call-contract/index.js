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

  console.log("\n==== User Addresses ====");
  console.log("user1 address:", user1.address);
  console.log("user2 address:", user2.address);

  // This is used for logging.
  const print = async () => {
    console.log(`Message at chain1: ${await chain1HelloContract.message()}`);
    console.log(`Message at chain2: ${await chain2HelloContract.message()}`);
  };

  console.log("\n==== Initially ====");
  await print();

  // Set the value on chain1. This will also cause the value on chain2 to change after relay() is called.
  // const msgFromUser1 = "hello";
  const msgFromUser1 = ethers.utils.defaultAbiCoder.encode(
    ["string"],
    ["Hello from: " + user1.address + `(${chain1.name})`]
  );

  //Set the gasLimit to 1e6 (a safe overestimate) and get the gas price (this is constant and always 1).

  const tx = await chain1HelloContract
    .connect(user1)
    .payGasAndCallContract(
      chain2.name,
      chain2HelloContract.address,
      msgFromUser1,
      {
        value: 100000,
      }
    )
    .then((tx) => tx.wait());

  await relay();

  // console.log("--- After Setting and Relaying ---");
  // await print();
})();
