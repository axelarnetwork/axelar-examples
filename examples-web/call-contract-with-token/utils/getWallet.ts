import { Wallet } from "ethers";

export function getWallet() {
  const mnemonic = process.env.NEXT_PUBLIC_EVM_MNEMONIC as string;
  const privateKey = process.env.NEXT_PUBLIC_EVM_PRIVATE_KEY as string;
  return privateKey ? new Wallet(privateKey) : Wallet.fromMnemonic(mnemonic);
}
