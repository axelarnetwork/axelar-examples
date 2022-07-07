import "dotenv/config";
const {
  utils: { deployContract },
} = require("@axelar-network/axelar-local-dev");

import { Contract, getDefaultProvider, Wallet } from "ethers";
import { defaultAbiCoder } from "ethers/lib/utils";

const chains = require("../config/chains");
const ethereumChain = chains.find((chain: any) => chain.name === "Ethereum");
const avalancheChain = chains.find((chain: any) => chain.name === "Avalanche");

// load contracts
const MessageSenderContract = require("../artifacts/contracts/MessageSender.sol/MessageSender.json");
const MessageReceiverContract = require("../artifacts/contracts/MessageReceiver.sol/MessageReceiver.json");

// create wallet
const mnemonic = process.env.NEXT_PUBLIC_EVM_MNEMONIC as string;
const wallet = Wallet.fromMnemonic(mnemonic);

console.log({
  address: wallet.address,
});

async function main() {
  // call on destination chain
  const avalancheProvider = getDefaultProvider(avalancheChain.rpc);
  const avalancheConnectedWallet = wallet.connect(avalancheProvider);
  const destContract = new Contract(
    avalancheChain.messageReceiver,
    MessageReceiverContract.abi,
    avalancheConnectedWallet
  );

  console.log({
    msg: await destContract.message(),
  });

  // call on source chain
  const ethProvider = getDefaultProvider(ethereumChain.rpc);
  const ethConnectedWallet = wallet.connect(ethProvider);
  const sourceContract = new Contract(
    ethereumChain.messageSender,
    MessageSenderContract.abi,
    ethConnectedWallet
  );

  const tx = await sourceContract.sendMessage(
    "Avalanche",
    avalancheChain.messageReceiver,
    "hello world!",
    {
      value: BigInt(3000000),
    }
  );
  await tx.wait();

  const event = destContract.on("Executed", (from, value) => {
    if (value === "hello world!") destContract.removeAllListeners("Executed");
  });

  console.log({
    msg: await destContract.message(),
  });
}

main();
