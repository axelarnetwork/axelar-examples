import "dotenv/config";
import { createAndExport } from "@axelar-network/axelar-local-dev";
import { Wallet } from "ethers";

// create wallet
const privateKey = process.env.NEXT_PUBLIC_EVM_PRIVATE_KEY as string;
const wallet = new Wallet(privateKey);

// deploy network
createAndExport({
  accountsToFund: [wallet.address],
  chains: ["Ethereum", "Avalanche"],
  chainOutputPath: "config/chains.json",
});
