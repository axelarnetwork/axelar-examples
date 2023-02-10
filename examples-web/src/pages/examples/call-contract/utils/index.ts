import { getDefaultProvider, Wallet } from "ethers";

import chains from "../../../../../public/chains.json"
import {MessageSender__factory as MessageSenderFactory, MessageReceiver__factory as MessageReceiverFactory  } from 'types/contracts/factories/contracts/call-contract'

const ethereumChain = chains.find((chain: any) => chain.name === "Ethereum") || chains[0] as any;
const avalancheChain = chains.find((chain: any) => chain.name === "Avalanche") || chains [1] as any;

const mnemonic = process.env.NEXT_PUBLIC_EVM_MNEMONIC as string;
const wallet = Wallet.fromMnemonic(mnemonic);

const ethProvider = getDefaultProvider(ethereumChain.rpc);
const ethConnectedWallet = wallet.connect(ethProvider);
const sourceContract = MessageSenderFactory.connect(ethereumChain?.callContract, ethConnectedWallet)

const avalancheProvider = getDefaultProvider(avalancheChain.rpc);
const avalancheConnectedWallet = wallet.connect(avalancheProvider);
const destContract = MessageReceiverFactory.connect(avalancheChain.callContract, avalancheConnectedWallet)

export async function sendMessageToAvalanche(message: string) {
  const tx = await sourceContract.sendMessage(
    "Avalanche",
    avalancheChain.callContract,
    message,
    {
      value: BigInt(3000000),
    }
  );
  await tx.wait();

  return new Promise((resolve, reject) => {
    destContract.on("Executed", (from, value) => {
      if (value === message) destContract.removeAllListeners("Executed");
      resolve(true);
    });
  });
}

export async function getAvalancheMessage() {
  return destContract.message();
}

export async function getAvalancheSourceChain() {
  return destContract.sourceChain();
}