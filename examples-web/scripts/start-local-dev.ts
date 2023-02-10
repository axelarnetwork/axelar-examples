import "dotenv/config";
import { createAndExport } from "@axelar-network/axelar-local-dev";
import { Wallet } from "ethers";

// create wallet
const mnemonic = process.env.NEXT_PUBLIC_EVM_MNEMONIC as string;
const wallet = Wallet.fromMnemonic(mnemonic);

// deploy network
createAndExport({
  accountsToFund: [wallet.address],
  chains: ["Ethereum", "Avalanche"],
  chainOutputPath: "config/chains.json",
  callback,
});

async function callback(chain: any) {
  await chain.deployToken('Axelar Wrapped aUSDC', 'aUSDC', 6, BigInt(1e70));
  await chain.giveToken(wallet.address, 'aUSDC', 1e12);
}
