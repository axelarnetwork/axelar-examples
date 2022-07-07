import { Contract, getDefaultProvider, Wallet } from "ethers";

const chains = require("../config/chains.json");
const MessageSenderContract = require("../artifacts/contracts/MessageSender.sol/MessageSender.json");
const MessageReceiverContract = require("../artifacts/contracts/MessageReceiver.sol/MessageReceiver.json");

const ethereumChain = chains.find((chain: any) => chain.name === "Ethereum");
const avalancheChain = chains.find((chain: any) => chain.name === "Avalanche");

const mnemonic = process.env.NEXT_PUBLIC_EVM_MNEMONIC as string;
const wallet = Wallet.fromMnemonic(mnemonic);

const ethProvider = getDefaultProvider(ethereumChain.rpc);
const ethConnectedWallet = wallet.connect(ethProvider);
const sourceContract = new Contract(
  ethereumChain.messageSender,
  MessageSenderContract.abi,
  ethConnectedWallet
);

const avalancheProvider = getDefaultProvider(avalancheChain.rpc);
const avalancheConnectedWallet = wallet.connect(avalancheProvider);
const destContract = new Contract(
  avalancheChain.messageReceiver,
  MessageReceiverContract.abi,
  avalancheConnectedWallet
);

export async function sendMessageToAvalanche(message: string) {
  const tx = await sourceContract.sendMessage(
    "Avalanche",
    avalancheChain.messageReceiver,
    message,
    {
      value: BigInt(3000000),
    }
  );
  await tx.wait();

  return new Promise((reject, resolve) => {
    destContract.on("Executed", (from, value) => {
      if (value === message) destContract.removeAllListeners("Executed");
      resolve();
    });
  });
}

export async function getAvalancheMessage() {
  return destContract.message();
}

export async function getAvalancheSourceChain() {
  return destContract.sourceChain();
}
