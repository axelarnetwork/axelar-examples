import {
  srcChain,
  destChain,
  srcConnectedWallet,
  destConnectedWallet,
} from "config/constants";
import {
  MessageSender__factory as MessageSenderFactory,
  MessageReceiver__factory as MessageReceiverFactory,
} from "types/factories/contracts/call-contract";

const sourceContract = MessageSenderFactory.connect(
  srcChain?.callContract,
  srcConnectedWallet,
);
const destContract = MessageReceiverFactory.connect(
  destChain.callContract,
  destConnectedWallet,
);

export async function sendMessageToAvalanche(message: string) {
  const tx = await sourceContract.sendMessage(
    destChain.name,
    destChain.callContract,
    message,
    {
      value: BigInt(3000000),
    },
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
