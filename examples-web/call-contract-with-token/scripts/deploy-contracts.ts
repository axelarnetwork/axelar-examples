import "dotenv/config";
import fs from "fs/promises";
import { getDefaultProvider, Wallet } from "ethers";
import { getWallet } from "../utils/getWallet";
const {
  utils: { deployContract },
} = require("@axelar-network/axelar-local-dev");

// load env

// create wallet
const wallet = getWallet();

const chains = process.env.NEXT_PUBLIC_ENVIRONMENT === "testnet" ? require("../config/testnet") : require("../config/chains");
const ethereumChain = chains.find((chain: any) => chain.name === "Ethereum");
const avalancheChain = chains.find((chain: any) => chain.name === "Avalanche");

// load contracts
const MessageSenderContract = require("../artifacts/contracts/MessageSender.sol/MessageSender.json");
const MessageReceiverContract = require("../artifacts/contracts/MessageReceiver.sol/MessageReceiver.json");

async function main() {
  // deploy on ethereum
  const ethProvider = getDefaultProvider(ethereumChain.rpc);
  const ethConnectedWallet = wallet.connect(ethProvider);
  const ethSender = await deployContract(
    ethConnectedWallet,
    MessageSenderContract,
    [ethereumChain.gateway, ethereumChain.gasReceiver]
  );
  ethereumChain.messageSender = ethSender.address;
  const ethReceiver = await deployContract(
    ethConnectedWallet,
    MessageReceiverContract,
    [ethereumChain.gateway, ethereumChain.gasReceiver]
  );
  ethereumChain.messageReceiver = ethReceiver.address;

  const avalancheProvider = getDefaultProvider(avalancheChain.rpc);
  const avalancheConnectedWallet = wallet.connect(avalancheProvider);
  const avalancheSender = await deployContract(
    avalancheConnectedWallet,
    MessageSenderContract,
    [avalancheChain.gateway, avalancheChain.gasReceiver]
  );
  avalancheChain.messageSender = avalancheSender.address;
  const avalancheReceiver = await deployContract(
    avalancheConnectedWallet,
    MessageReceiverContract,
    [avalancheChain.gateway, avalancheChain.gasReceiver]
  );
  avalancheChain.messageReceiver = avalancheReceiver.address;

  // update chains
  const updatedChains = [ethereumChain, avalancheChain];
  await fs.writeFile(
    "config/chains.json",
    JSON.stringify(updatedChains, null, 2)
  );
}

main();
