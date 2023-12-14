import "dotenv/config";
import fs from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import { Wallet } from "ethers";
import { configPath } from "../../config";
import { deploy as deployCallContract } from "./call-contract";
import { deploy as deployCallContractWithToken } from "./call-contract-with-token";
import { deploy as deployNftLinker } from "./nft-linker";

// create wallet
const privateKey = process.env.NEXT_PUBLIC_EVM_PRIVATE_KEY as string;
const wallet = new Wallet(privateKey);

const chains = require(configPath.localEvmChains);
const ethereumChain =
  chains.find((chain: any) => chain.name === "Ethereum") || (chains[0] as any);
const avalancheChain =
  chains.find((chain: any) => chain.name === "Avalanche") || (chains[1] as any);

function print(chain: any) {
  console.log(`Deployed example contracts on ${chain.name}`);
  console.log("callContract:", chain.callContract);
  console.log("callContractWithToken:", chain.callContractWithToken);
  console.log("nftLinker:", chain.nftLinker);
}

async function main() {
  const [chainA, chainB] = await deployCallContract(
    wallet,
    ethereumChain,
    avalancheChain
  )
    .then(() =>
      deployCallContractWithToken(wallet, ethereumChain, avalancheChain)
    )
    .then(() => deployNftLinker(wallet, ethereumChain, avalancheChain));

  print(chainA);
  console.log("");
  print(chainB);

  // update chains
  const updatedChains = [chainA, chainB];
  const _path = path.resolve(configPath.localEvmChains);
  const dirname = path.dirname(_path);
  if (!existsSync(dirname)) {
    await mkdirSync(dirname, { recursive: true });
  }
  const publicPath = path.resolve(__dirname, "../public/chains.json");
  await fs.writeFile(_path, JSON.stringify(updatedChains, null, 2));
  await fs.writeFile(publicPath, JSON.stringify(updatedChains, null, 2));
}

main();
