import {
  srcChain,
  destChain,
  srcConnectedWallet,
  destConnectedWallet,
} from "config/constants";
import {CallContract__factory as CallContractFactory } from '../../../src/types/factories/contracts/call-contract'


const sourceContract = CallContractFactory.connect(
  srcChain?.callContract,
  srcConnectedWallet,
);
const destContract = CallContractFactory.connect(
  destChain.callContract,
  destConnectedWallet,
);

export async function sendMessageToAvalanche(message: string) {
  const tx = await sourceContract.sendInterchainMessage(
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
