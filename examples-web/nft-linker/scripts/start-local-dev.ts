import { createAndExport } from "@axelar-network/axelar-local-dev";
import { Network } from "@axelar-network/axelar-local-dev/dist/Network";
import { wallet } from "../config/constants";

// deploy network
createAndExport({
  accountsToFund: [wallet.address],
  chains: ["Moonbeam", "Avalanche"],
  chainOutputPath: "config/local.json",
  async callback(network: Network) {
    if (network.name === "Avalanche") {
      await network.giveToken(
        wallet.address,
        "aUSDC",
        BigInt("100000000000000"),
      );
    }
  },
});
