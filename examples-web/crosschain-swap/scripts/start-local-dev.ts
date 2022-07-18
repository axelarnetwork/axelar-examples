import { createAndExport } from "@axelar-network/axelar-local-dev";
import { Network } from "@axelar-network/axelar-local-dev/dist/Network";
import { wallet } from "../config/constants";

// deploy network
async function callback(chain: any, info: any) {
  await chain.deployToken('Axelar Wrapped USDC', 'aUSDC', 6, BigInt(1e17));
  console.log("chain in question",chain.name, wallet.address)
  for (const address of [wallet.address]) await chain.giveToken(address, 'aUSDC', BigInt(1e15));
  return null;
}
createAndExport({
  accountsToFund: [wallet.address],
  chains: ["Avalanche", "Moonbeam"],
  chainOutputPath: "./config/local.json",
  callback
});
