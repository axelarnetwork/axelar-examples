import "dotenv/config";
const {
  utils: { deployContract },
} = require("@axelar-network/axelar-local-dev");

import fs from "fs/promises";
import { getDefaultProvider, Wallet } from "ethers";

// load env

// create wallet
const mnemonic = process.env.NEXT_PUBLIC_EVM_MNEMONIC as string;
const wallet = Wallet.fromMnemonic(mnemonic);

const chains = require("../config/chains");
const ethereumChain = chains.find((chain: any) => chain.name === "Ethereum");
const avalancheChain = chains.find((chain: any) => chain.name === "Avalanche");

// load contracts
const MessageSenderContract = require("../artifacts/contracts/MessageSender.sol/MessageSender.json");
const MessageReceiverContract = require("../artifacts/contracts/MessageReceiver.sol/MessageReceiver.json");

async function main() {
  // deploy on ethereum
  const ethProvider = getDefaultProvider(ethereumChain.rpc);
  const ethConnectedWallet = wallet.connect(ethProvider);
  const ethContract = await deployContract(
    ethConnectedWallet,
    MessageSenderContract,
    [ethereumChain.gateway, ethereumChain.gasReceiver]
  );

  ethereumChain.messageSender = ethContract.address;

  const avalancheProvider = getDefaultProvider(avalancheChain.rpc);
  const avalancheConnectedWallet = wallet.connect(avalancheProvider);
  const avalancheContract = await deployContract(
    avalancheConnectedWallet,
    MessageReceiverContract,
    [avalancheChain.gateway, avalancheChain.gasReceiver]
  );

  avalancheChain.messageReceiver = avalancheContract.address;

  // update chains
  const updatedChains = [ethereumChain, avalancheChain];
  await fs.writeFile(
    "config/chains.json",
    JSON.stringify(updatedChains, null, 2)
  );
}

main();
