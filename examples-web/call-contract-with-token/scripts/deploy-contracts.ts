import "dotenv/config";
import fs from "fs/promises";
import { getDefaultProvider } from "ethers";
import { getWallet } from "../utils/getWallet";
const {
  utils: { deployContract },
} = require("@axelar-network/axelar-local-dev");

// load env

// create wallet
const wallet = getWallet();

const chains =
  process.env.NEXT_PUBLIC_ENVIRONMENT === "testnet"
    ? require("../config/testnet")
    : require("../config/chains");
const moonbeamChain = chains.find((chain: any) => chain.name === "Moonbeam");
const avalancheChain = chains.find((chain: any) => chain.name === "Avalanche");

// load contracts
const MessageSenderContract = require("../artifacts/contracts/MessageSender.sol/MessageSender.json");
const MessageReceiverContract = require("../artifacts/contracts/MessageReceiver.sol/MessageReceiver.json");

async function main() {
  // deploy on moonbeam
  const moonbeamProvider = getDefaultProvider(moonbeamChain.rpc);
  const moonbeamConnectedWallet = wallet.connect(moonbeamProvider);
  const moonbeeamSender = await deployContract(
    moonbeamConnectedWallet,
    MessageSenderContract,
    [moonbeamChain.gateway, moonbeamChain.gasReceiver]
  );
  console.log("MessageSender deployed on Moonbeam:", moonbeeamSender.address);
  moonbeamChain.messageSender = moonbeeamSender.address;
  const moonbeamReceiver = await deployContract(
    moonbeamConnectedWallet,
    MessageReceiverContract,
    [moonbeamChain.gateway, moonbeamChain.gasReceiver]
  );
  console.log(
    "MessageReceiver deployed on Moonbeam:",
    moonbeamReceiver.address
  );
  moonbeamChain.messageReceiver = moonbeamReceiver.address;

  const avalancheProvider = getDefaultProvider(avalancheChain.rpc);
  const avalancheConnectedWallet = wallet.connect(avalancheProvider);
  const avalancheSender = await deployContract(
    avalancheConnectedWallet,
    MessageSenderContract,
    [avalancheChain.gateway, avalancheChain.gasReceiver]
  );
  console.log("MessageSender deployed on Avalanche:", avalancheSender.address);
  avalancheChain.messageSender = avalancheSender.address;
  const avalancheReceiver = await deployContract(
    avalancheConnectedWallet,
    MessageReceiverContract,
    [avalancheChain.gateway, avalancheChain.gasReceiver]
  );
  console.log(
    "MessageReceiver deployed on Avalanche:",
    avalancheReceiver.address
  );
  avalancheChain.messageReceiver = avalancheReceiver.address;

  // update chains
  const updatedChains = [moonbeamChain, avalancheChain];
  await fs.writeFile(
    "config/chains.json",
    JSON.stringify(updatedChains, null, 2)
  );
}

main();
