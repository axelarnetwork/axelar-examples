import { createAndExport } from "@axelar-network/axelar-local-dev";
import { Network } from "@axelar-network/axelar-local-dev/dist/Network";
import { deployerWallet } from "../config/constants";

// deploy network
createAndExport({
  accountsToFund: [deployerWallet.address],
  chains: ["Moonbeam", "Avalanche"],
  chainOutputPath: "config/local.json",
  async callback(network: Network) {
    await network.deployToken("USDC", "aUSDC", 6, BigInt(100_000_000e6));

    if (network.name === "Avalanche") {
      await network.giveToken(
        deployerWallet.address,
        "aUSDC",
        BigInt("100000000000000"),
      );
    }
  },
});
