import "dotenv/config";
import { createAndExport } from "@axelar-network/axelar-local-dev";
import { Network } from "@axelar-network/axelar-local-dev/dist/Network";
import { getWallet } from "../utils/getWallet";

// create wallet
const wallet = getWallet();

// deploy network
createAndExport({
  accountsToFund: [wallet.address],
  chains: ["Ethereum", "Avalanche"],
  chainOutputPath: "config/chains.json",
  async callback(network: Network) {
    if (network.name === "Ethereum") {
      await network.giveToken(
        wallet.address,
        "aUSDC",
        BigInt("100000000000000")
      );
    }

    return null;
  },
});
