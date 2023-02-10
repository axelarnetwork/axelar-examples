import "dotenv/config";
import fs from "fs/promises";
import path from 'path'
import {  Wallet } from "ethers";
import chains from "../config/chains.json";
import {deploy as deployCallContract} from './call-contract'
import {deploy as deployCallContractWithToken} from './call-contract-with-token'
import { deploy as deployNftLinker } from "./nft-linker";

// create wallet
const mnemonic = process.env.NEXT_PUBLIC_EVM_MNEMONIC as string;
const wallet = Wallet.fromMnemonic(mnemonic);

const ethereumChain = chains.find((chain: any) => chain.name === "Ethereum") || chains[0] as any;
const avalancheChain = chains.find((chain: any) => chain.name === "Avalanche") || chains[1] as any;

async function main() {
  const [chainA, chainB] = await deployCallContract(wallet, ethereumChain, avalancheChain)
    .then(() => deployCallContractWithToken(wallet, ethereumChain, avalancheChain))
    .then(() => deployNftLinker(wallet, ethereumChain, avalancheChain));

    // update chains
  const updatedChains = [chainA, chainB];
  const _path = path.resolve(__dirname, '../config/chains.json')
  const publicPath = path.resolve(__dirname, '../public/chains.json')
  await fs.writeFile(
    _path,
    JSON.stringify(updatedChains, null, 2)
  );
  await fs.writeFile(
    publicPath,
    JSON.stringify(updatedChains, null, 2)
  );
}

main();
