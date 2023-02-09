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
import {MessageSender__factory as MessageSenderFactory, MessageReceiver__factory as MessageReceiverFactory} from '../types/contracts/factories'

async function main() {
  // deploy on ethereum
  const ethProvider = getDefaultProvider(ethereumChain.rpc);
  const ethConnectedWallet = wallet.connect(ethProvider);
  const msgSenderFactory = new MessageSenderFactory(ethConnectedWallet)
  const msgSender = await msgSenderFactory.deploy(ethereumChain.gateway, ethereumChain.gasService)

  ethereumChain.messageSender = msgSender.address;

  const avalancheProvider = getDefaultProvider(avalancheChain.rpc);
  const avalancheConnectedWallet = wallet.connect(avalancheProvider);
  const msgReceiverFactory = new MessageReceiverFactory(avalancheConnectedWallet)
  const msgReceiver = await msgReceiverFactory.deploy(avalancheChain.gateway, avalancheChain.gasService)

  avalancheChain.messageReceiver = msgReceiver.address;

  // update chains
  const updatedChains = [ethereumChain, avalancheChain];
  await fs.writeFile(
    "src/config/chains.json",
    JSON.stringify(updatedChains, null, 2)
  );
}

main();
