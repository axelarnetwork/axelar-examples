import { ethers, getDefaultProvider, providers } from "ethers";
import {
  AxelarQueryAPI,
  Environment,
  EvmChain,
  GasToken,
} from "@axelar-network/axelarjs-sdk";

import {MessageReceiver__factory as MessageReceiverFactory, MessageSender__factory as MessageSenderFactory} from 'types/contracts/factories/contracts/call-contract-with-token/contracts'
import {IAxelarGateway__factory as AxelarGatewayFactory, IERC20__factory as IERC20Factory } from 'types/contracts/factories/@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces'
import { isTestnet, wallet } from "../../../../config/constants";

const chains = isTestnet
  ? require("../../../../../config/testnet.json")
  : require("../../../../../config/chains.json");

const ethereumChain = chains.find(
  (chain: any) => chain.name === "Ethereum",
) as any;
const avalancheChain = chains.find(
  (chain: any) => chain.name === "Avalanche",
) as any;

const useMetamask = false; // typeof window === 'object';

const ethereumProvider = useMetamask
  ? new providers.Web3Provider((window as any).ethereum)
  : getDefaultProvider(ethereumChain.rpc);
const ethereumConnectedWallet = useMetamask
  ? (ethereumProvider as providers.Web3Provider).getSigner()
  : wallet.connect(ethereumProvider);
const avalancheProvider = getDefaultProvider(avalancheChain.rpc);
const avalancheConnectedWallet = wallet.connect(avalancheProvider);

const srcGatewayContract = AxelarGatewayFactory.connect(ethereumChain.gateway, ethereumConnectedWallet)
const destGatewayContract = AxelarGatewayFactory.connect(avalancheChain.gateway, avalancheConnectedWallet)

const sourceContract = MessageSenderFactory.connect(ethereumChain.callContractWithToken as string, ethereumConnectedWallet)
const destContract = MessageReceiverFactory.connect(avalancheChain.callContractWithToken as string, avalancheConnectedWallet)

export function generateRecipientAddress(): string {
  return ethers.Wallet.createRandom().address;
}

export async function sendTokenToDestChain(
  amount: string,
  recipientAddresses: string[],
  onSent: (txhash: string) => void,
) {
  // Get token address from the gateway contract
  const tokenAddress = await srcGatewayContract.tokenAddresses("aUSDC");

  const erc20 = IERC20Factory.connect(tokenAddress, ethereumConnectedWallet)

  // Approve the token for the amount to be sent
  await erc20
    .approve(sourceContract.address, ethers.utils.parseUnits(amount, 6))
    .then((tx: any) => tx.wait());

  const api = new AxelarQueryAPI({ environment: Environment.TESTNET });

  // Calculate how much gas to pay to Axelar to execute the transaction at the destination chain
  const gasFee = await api.estimateGasFee(
    EvmChain.ETHEREUM,
    EvmChain.AVALANCHE,
    GasToken.ETH,
    700000,
    2,
  );

  // Send the token
  const receipt = await sourceContract
    .sendToMany(
      "Avalanche",
      destContract.address,
      recipientAddresses,
      "aUSDC",
      ethers.utils.parseUnits(amount, 6),
      {
        value: BigInt(isTestnet ? gasFee : 3000000),
      },
    )
    .then((tx: any) => tx.wait());

  console.log({
    txHash: receipt.transactionHash,
  });
  onSent(receipt.transactionHash);

  // Wait destination contract to execute the transaction.
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
    ? ethereumConnectedWallet
    : avalancheConnectedWallet;
  const tokenAddress = await contract.tokenAddresses("aUSDC");
  const erc20 = IERC20Factory.connect(tokenAddress, connectedWallet)
  const balances = await Promise.all(
    addresses.map(async (address) => {
      console.log('balanceof', address)
      const balance = await erc20.balanceOf(address);
      console.log(balance.toString());
      return ethers.utils.formatUnits(balance, 6);
    }),
  );
  return balances;
}
