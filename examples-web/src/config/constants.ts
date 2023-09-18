import { getDefaultProvider, providers, Wallet } from "ethers";
import testnetInfo from "@axelar-network/axelar-chains-config/info/testnet.json";
import local from "../../../chain-config/local.json";

if (typeof window === "undefined") {
  require("dotenv").config();
}

function getWallet() {
  const mnemonic = process.env.NEXT_PUBLIC_EVM_MNEMONIC as string;
  const privateKey = process.env.NEXT_PUBLIC_EVM_PRIVATE_KEY as string;
  return privateKey ? new Wallet(privateKey) : Wallet.fromMnemonic(mnemonic);
}

export const isTestnet = process.env.NEXT_PUBLIC_ENVIRONMENT === "testnet";
export const wallet = getWallet();

export const localChains = local as any;

const testnetChains = Object.entries(testnetInfo).map(([, value]) => {
  return value;
});

export const chains = isTestnet ? testnetChains : (local as any);

export const srcChain = chains.find(
  (chain: any) => chain.name === "Ethereum"
) as any;

export const destChain = chains.find(
  (chain: any) => chain.name === "Avalanche"
) as any;

const useMetamask = false;

export const srcProvider = useMetamask
  ? new providers.Web3Provider((window as any).ethereum)
  : getDefaultProvider(srcChain.rpc);
export const srcConnectedWallet = useMetamask
  ? (srcProvider as providers.Web3Provider).getSigner()
  : wallet.connect(srcProvider);

export const destProvider = getDefaultProvider(destChain.rpc);
export const destConnectedWallet = wallet.connect(destProvider);
