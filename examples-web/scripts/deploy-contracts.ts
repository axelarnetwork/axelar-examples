import "dotenv/config";
import fs from "fs/promises";
import { getDefaultProvider, Wallet } from "ethers";

// load env

// create wallet
const mnemonic = process.env.NEXT_PUBLIC_EVM_MNEMONIC as string;
const wallet = Wallet.fromMnemonic(mnemonic);

import chains from "../config/chains.json";
import path from 'path'
const ethereumChain = chains.find((chain: any) => chain.name === "Ethereum") || chains[0] as any;
const avalancheChain = chains.find((chain: any) => chain.name === "Avalanche") || chains[1] as any;

// load contracts
import {MessageSender__factory as MessageSenderFactory, MessageReceiver__factory as MessageReceiverFactory} from '../src/types/contracts/factories'

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
  const _path = path.resolve(__dirname, '../config/chains.json')
  const publicPath = path.resolve(__dirname, '../src/public/chains.json')
  await fs.writeFile(
    _path,
    JSON.stringify(updatedChains, null, 2)
  );
  await fs.writeFile(
    publicPath,
    JSON.stringify(updatedChains, null, 2)
  );
}

main();
