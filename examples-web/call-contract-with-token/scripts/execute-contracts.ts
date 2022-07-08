import { Contract, getDefaultProvider, Wallet } from "ethers";
import { defaultAbiCoder } from "ethers/lib/utils";
import { wallet } from "../config/constants";

const {
  utils: { deployContract },
} = require("@axelar-network/axelar-local-dev");

const chains = require("../config/chains");
const moonbeamChain = chains.find((chain: any) => chain.name === "Moonbeam");
const avalancheChain = chains.find((chain: any) => chain.name === "Avalanche");

// load contracts
const MessageSenderContract = require("../artifacts/contracts/MessageSender.sol/MessageSender.json");
const MessageReceiverContract = require("../artifacts/contracts/MessageReceiver.sol/MessageReceiver.json");

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
    avalancheConnectedWallet,
  );

  console.log({
    msg: await destContract.message(),
  });

  // call on source chain
  const ethProvider = getDefaultProvider(moonbeamChain.rpc);
  const ethConnectedWallet = wallet.connect(ethProvider);
  const sourceContract = new Contract(
    moonbeamChain.messageSender,
    MessageSenderContract.abi,
    ethConnectedWallet,
  );

  const tx = await sourceContract.sendMessage(
    "Avalanche",
    avalancheChain.messageReceiver,
    "hello world!",
    {
      value: BigInt(3000000),
    },
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
