import { Wallet } from "ethers";

export function getWallet() {
    const mnemonic = process.env.NEXT_PUBLIC_EVM_MNEMONIC as string;
    const private_key = process.env.NEXT_PUBLIC_EVM_PRIVATE_KEY as string;
    return private_key ? new Wallet(private_key) : Wallet.fromMnemonic(mnemonic);
  };