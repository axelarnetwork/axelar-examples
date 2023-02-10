import "dotenv/config";
import fs from "fs/promises";
import path from 'path'
import { getDefaultProvider, Wallet } from "ethers";
import chains from "../config/chains.json";
import {MessageSender__factory as CallContractSenderFactory, MessageReceiver__factory as CallContractReceiverFactory} from '../src/types/contracts/factories/call-contract'
import {MessageSender__factory as CallContractWithTokenSenderFactory, MessageReceiver__factory as CallContractWithTokenReceiverFactory} from '../src/types/contracts/factories/call-contract-with-token/contracts'

// create wallet
const mnemonic = process.env.NEXT_PUBLIC_EVM_MNEMONIC as string;
const wallet = Wallet.fromMnemonic(mnemonic);

const ethereumChain = chains.find((chain: any) => chain.name === "Ethereum") || chains[0] as any;
const avalancheChain = chains.find((chain: any) => chain.name === "Avalanche") || chains[1] as any;

async function main() {
  // deploy on ethereum
  const ethProvider = getDefaultProvider(ethereumChain.rpc);
  const avalancheProvider = getDefaultProvider(avalancheChain.rpc);
  const ethConnectedWallet = wallet.connect(ethProvider);
  const avalancheConnectedWallet = wallet.connect(avalancheProvider);

  const callContractSenderFactory = new CallContractSenderFactory(ethConnectedWallet)
  const callContractReceiverFactory = new CallContractReceiverFactory(avalancheConnectedWallet)
  const callContractWithTokenSenderFactory = new CallContractWithTokenSenderFactory(ethConnectedWallet)
  const callContractWithTokenReceiverFactory = new CallContractWithTokenReceiverFactory(avalancheConnectedWallet)

  const callContractSender = await callContractSenderFactory.deploy(ethereumChain.gateway, ethereumChain.gasService)
  const callContractReceiver = await callContractReceiverFactory.deploy(avalancheChain.gateway, avalancheChain.gasService)
  const callContractWithTokenSender = await callContractWithTokenSenderFactory.deploy(ethereumChain.gateway, ethereumChain.gasService)
  const callContractWithTokenReceiver = await callContractWithTokenReceiverFactory.deploy(avalancheChain.gateway, avalancheChain.gasService)

  ethereumChain.callContract = callContractSender.address;
  avalancheChain.callContract = callContractReceiver.address;
  ethereumChain.callContractWithToken = callContractWithTokenSender.address;
  avalancheChain.callContractWithToken = callContractWithTokenReceiver.address;

  // update chains
  const updatedChains = [ethereumChain, avalancheChain];
  const _path = path.resolve(__dirname, '../config/chains.json')
  const publicPath = path.resolve(__dirname, '../public/chains.json')
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
