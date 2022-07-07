import { Contract, ethers, getDefaultProvider, Wallet } from "ethers";

import chains from "../config/chains.json";
import MessageSenderContract from "../artifacts/contracts/MessageSender.sol/MessageSender.json";
import MessageReceiverContract from "../artifacts/contracts/MessageReceiver.sol/MessageReceiver.json";
import IERC20 from "../artifacts/@axelar-network/axelar-cgp-solidity/contracts/interfaces/IERC20.sol/IERC20.json";

const ethereumChain = chains.find((chain: any) => chain.name === "Ethereum");
const avalancheChain = chains.find((chain: any) => chain.name === "Avalanche");

if (!ethereumChain || !avalancheChain) process.exit(0);

const privateKey = process.env.NEXT_PUBLIC_EVM_PRIVATE_KEY as string;
const wallet = new Wallet(privateKey);

const ethProvider = getDefaultProvider(ethereumChain.rpc);
const ethConnectedWallet = wallet.connect(ethProvider);

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
  ethereumChain.gateway,
  gatewayAbi,
  ethConnectedWallet
);

const sourceContract = new Contract(
  ethereumChain.messageSender as string,
  MessageSenderContract.abi,
  ethConnectedWallet
);

const avalancheProvider = getDefaultProvider(avalancheChain.rpc);
const avalancheConnectedWallet = wallet.connect(avalancheProvider);
const destContract = new Contract(
  avalancheChain.messageReceiver as string,
  MessageReceiverContract.abi,
  avalancheConnectedWallet
);
const destGatewayContract = new Contract(
  avalancheChain.gateway,
  gatewayAbi,
  avalancheConnectedWallet
);

export function generateRecipientAddress(): string {
  return ethers.Wallet.createRandom().address;
}

export async function sendTokenToAvalanche(
  amount: string,
  recipientAddresses: string[]
) {
  const tokenAddress = await srcGatewayContract.tokenAddresses("aUSDC");
  const erc20 = new Contract(tokenAddress, IERC20.abi, ethConnectedWallet);
  await erc20.approve(
    sourceContract.address,
    ethers.utils.parseUnits(amount, 6)
  );
  console.log(amount);
  const tx = await sourceContract.sendToMany(
    "Avalanche",
    destContract.address,
    recipientAddresses,
    "aUSDC",
    ethers.utils.parseUnits(amount, 6),
    {
      value: BigInt(30000000),
    }
  );
  await tx.wait();
  console.log(tx.hash);

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

export async function getAvalancheBalance(
  addresses: string[],
  isSource: boolean
) {
  const contract = isSource ? srcGatewayContract : destGatewayContract;
  const connectedWallet = isSource
    ? ethConnectedWallet
    : avalancheConnectedWallet;
  const tokenAddress = await contract.tokenAddresses("aUSDC");
  const erc20 = new Contract(tokenAddress, IERC20.abi, connectedWallet);
  console.log(tokenAddress);
  const balances = await Promise.all(
    addresses.map(async (address) => {
      const balance = await erc20.balanceOf(address);
      return ethers.utils.formatUnits(balance, 6);
    })
  );
  return balances;
}
