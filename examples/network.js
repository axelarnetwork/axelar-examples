const { ethers } = require("ethers");
const { createNetwork } = require("@axelar-network/axelar-local-dev");
const erc20 = require("./call-contract-with-token/build/ERC20.json");
const gateway = require("./call-contract-with-token/build/IAxelarGateway.json");
const gasReceiver = require("./call-contract-with-token/build/IAxelarGasReceiver.json");

// Create two chains and fund given wallet address.
const setupLocalNetwork = async (senderAddress) => {
  console.log("==== Chains and contracts setup ====");
  const chainA = await createNetwork({ seed: "chainA" });
  const chainB = await createNetwork({ seed: "chainB" });

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

  return {
    chainA: {
      name: chainA.name,
      provider: chainA.provider,
      ust: chainA.ust,
      gateway: chainA.gateway,
      gasReceiver: chainA.gasReceiver,
    },
    chainB: {
      name: chainB.name,
      provider: chainB.provider,
      ust: chainB.ust,
      gateway: chainB.gateway,
      gasReceiver: chainB.gasReceiver,
    },
  };
};

const setupTestnetNetwork = () => {
  const providerChainA = new ethers.providers.JsonRpcProvider(
    "https://api.avax-test.network/ext/bc/C/rpc"
  );
  const providerChainB = new ethers.providers.JsonRpcProvider(
    "https://moonbeam-alpha.api.onfinality.io/public"
  );

  return {
    chainA: {
      name: "avalanche",
      provider: providerChainA,
      ust: new ethers.Contract(
        "0x43F4600b552089655645f8c16D86A5a9Fa296bc3",
        erc20.abi,
        providerChainA
      ),
      gateway: new ethers.Contract(
        "0xC249632c2D40b9001FE907806902f63038B737Ab",
        gateway.abi,
        providerChainA
      ),
      gasReceiver: new ethers.Contract(
        "0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6",
        gasReceiver.abi,
        providerChainA
      ),
    },
    chainB: {
      name: "moonbeam",
      provider: providerChainB,
      ust: new ethers.Contract(
        "0xd34007bb8a54b2fbb1d6647c5aba04d507abd21d",
        erc20.abi,
        providerChainB
      ),
      gateway: new ethers.Contract(
        "0x5769D84DD62a6fD969856c75c7D321b84d455929",
        gateway.abi,
        providerChainB
      ),
      gasReceiver: new ethers.Contract(
        "0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6",
        gasReceiver.abi,
        providerChainB
      ),
    },
  };
};

module.exports = {
  setupLocalNetwork,
  setupTestnetNetwork,
};
