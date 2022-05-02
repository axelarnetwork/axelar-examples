const { ethers } = require("ethers");
const { createNetwork, relay } = require("@axelar-network/axelar-local-dev");
const fs = require("fs");
const { privateKey } = require("../secret.json");
const {
  Network,
  RemoteNetwork,
} = require("@axelar-network/axelar-local-dev/dist/Network");

async function startLocal() {
  console.log("==== Chains and contracts setup ====");
  const chainA = await createNetwork({ seed: "chainA", port: 8500 });
  const chainB = await createNetwork({ seed: "chainB", port: 8501 });

  const { address: senderAddress } = new ethers.Wallet(privateKey);

  await chainA.userWallets[0]
    .sendTransaction({
      to: senderAddress,
      value: ethers.utils.parseUnits("100", 18),
    })
    .then((tx) => tx.wait());
  await chainB.userWallets[0]
    .sendTransaction({
      to: senderAddress,
      value: ethers.utils.parseUnits("100", 18),
    })
    .then((tx) => tx.wait());
  await chainA.giveToken(
    senderAddress,
    "UST",
    ethers.utils.parseUnits("1000", 6)
  );

  const chainData = {
    chainA: {
      name: chainA.name,
      provider: "http://localhost:8500",
      ust: chainA.ust.address,
      gateway: chainA.gateway.address,
      gasReceiver: chainA.gasReceiver.address,
    },
    chainB: {
      name: chainB.name,
      provider: "http://localhost:8501",
      ust: chainB.ust.address,
      gateway: chainB.gateway.address,
      gasReceiver: chainB.gasReceiver.address,
    },
  };

  fs.writeFileSync("./chain-local.json", JSON.stringify(chainData, null, 2));

  setInterval(async () => {
    await relay();
  }, 1000);
}

startLocal();
