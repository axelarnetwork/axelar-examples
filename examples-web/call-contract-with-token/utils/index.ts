import { Contract, ethers, getDefaultProvider, providers } from "ethers";
import chains from "../config/chains.json";
import MessageSenderContract from "../artifacts/contracts/MessageSender.sol/MessageSender.json";
import MessageReceiverContract from "../artifacts/contracts/MessageReceiver.sol/MessageReceiver.json";
import IERC20 from "../artifacts/@axelar-network/axelar-cgp-solidity/contracts/interfaces/IERC20.sol/IERC20.json";
import { getWallet } from "./getWallet";

const moonbeamChain = chains.find((chain: any) => chain.name === "Moonbeam");
const avalancheChain = chains.find((chain: any) => chain.name === "Avalanche");

if (!moonbeamChain || !avalancheChain) process.exit(0);

export const wallet = getWallet();

const useMetamask = false; // typeof window === 'object';

const ethProvider = useMetamask
  ? new providers.Web3Provider((window as any).ethereum)
  : getDefaultProvider(moonbeamChain.rpc);
const ethConnectedWallet = useMetamask
  ? (ethProvider as providers.Web3Provider).getSigner()
  : wallet.connect(ethProvider);
const avalancheProvider = getDefaultProvider(avalancheChain.rpc);
const avalancheConnectedWallet = wallet.connect(avalancheProvider);

const gatewayAbi = [
  {
    inputs: [
      {
        internalType: "string",
        name: "symbol",
        type: "string",
      },
    ],
    name: "tokenAddresses",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const srcGatewayContract = new Contract(
  avalancheChain.gateway,
  gatewayAbi,
  avalancheConnectedWallet
);

const sourceContract = new Contract(
  avalancheChain.messageSender as string,
  MessageSenderContract.abi,
  avalancheConnectedWallet
);

const destContract = new Contract(
  moonbeamChain.messageReceiver as string,
  MessageReceiverContract.abi,
  ethConnectedWallet
);
const destGatewayContract = new Contract(
  moonbeamChain.gateway,
  gatewayAbi,
  ethConnectedWallet
);

export function generateRecipientAddress(): string {
  return ethers.Wallet.createRandom().address;
}

export async function sendTokenToDestChain(
  amount: string,
  recipientAddresses: string[]
) {
  const tokenAddress = await srcGatewayContract.tokenAddresses("aUSDC");
  const erc20 = new Contract(
    tokenAddress,
    IERC20.abi,
    avalancheConnectedWallet
  );
  await erc20
    .approve(sourceContract.address, ethers.utils.parseUnits(amount, 6))
    .then((tx: any) => tx.wait());
  const tx = await sourceContract.sendToMany(
    "Moonbeam",
    destContract.address,
    recipientAddresses,
    "aUSDC",
    ethers.utils.parseUnits(amount, 6),
    {
      value: BigInt(700000),
    }
  );
  await tx.wait();

  return new Promise((resolve, reject) => {
    destContract.on("Executed", () => {
      destContract.removeAllListeners("Executed");
      resolve(null);
    });
  });
}

export function truncatedAddress(address: string): string {
  return (
    address.substring(0, 6) + "..." + address.substring(address.length - 4)
  );
}

export async function getBalance(addresses: string[], isSource: boolean) {
  const contract = isSource ? srcGatewayContract : destGatewayContract;
  const connectedWallet = isSource
    ? avalancheConnectedWallet
    : ethConnectedWallet;
  const tokenAddress = await contract.tokenAddresses("aUSDC");
  const erc20 = new Contract(tokenAddress, IERC20.abi, connectedWallet);
  const balances = await Promise.all(
    addresses.map(async (address) => {
      const balance = await erc20.balanceOf(address);
      return ethers.utils.formatUnits(balance, 6);
    })
  );
  return balances;
}
