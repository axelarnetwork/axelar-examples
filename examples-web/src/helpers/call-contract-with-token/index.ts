import { ethers } from "ethers";
import {
  AxelarQueryAPI,
  Environment,
  EvmChain,
  GasToken,
} from "@axelar-network/axelarjs-sdk";
import {
  CallContractWithToken__factory as CallContractWithTokenFactory
} from "types/factories/contracts/call-contract-with-token/contracts";
import {
  IAxelarGateway__factory as AxelarGatewayFactory,
  IERC20__factory as IERC20Factory,
} from "types/factories/@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces";
import {
  isTestnet,
  srcChain,
  srcConnectedWallet,
  destChain,
  destConnectedWallet,
} from "config/constants";

const srcGatewayContract = AxelarGatewayFactory.connect(
  srcChain.gateway,
  srcConnectedWallet
);
const destGatewayContract = AxelarGatewayFactory.connect(
  destChain.gateway,
  destConnectedWallet
);

const sourceContract = CallContractWithTokenFactory.connect(
  srcChain.callContractWithToken as string,
  srcConnectedWallet
);
const destContract = CallContractWithTokenFactory.connect(
  destChain.callContractWithToken as string,
  destConnectedWallet
);

export function generateRecipientAddress(): string {
  return ethers.Wallet.createRandom().address;
}

export async function sendTokenToDestChain(
  amount: string,
  recipientAddresses: string[],
  onSent: (txhash: string) => void
) {
  // Get token address from the gateway contract
  const tokenAddress = await srcGatewayContract.tokenAddresses("aUSDC");

  const erc20 = IERC20Factory.connect(tokenAddress, srcConnectedWallet);

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
    2
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
      }
    )
    .then((tx: any) => tx.wait());

  onSent(receipt.transactionHash);
}

export async function waitDestExecution() {
  const currentBlock = await destConnectedWallet.provider.getBlockNumber();
  return new Promise((resolve, reject) => {
    destContract.on("Executed", (event) => {
      if (event.blockNumber <= currentBlock) return;
      destContract.removeAllListeners("Executed");
      resolve(null);
    });
  });
}

export function truncatedAddress(address: string): string {
  return (
    address.substring(0, 6) + "..." + address.substring(address.length - 6)
  );
}

export async function getBalance(addresses: string[], isSource: boolean) {
  const contract = isSource ? srcGatewayContract : destGatewayContract;
  const connectedWallet = isSource ? srcConnectedWallet : destConnectedWallet;

  const tokenAddress = await contract.tokenAddresses("aUSDC");
  const erc20 = IERC20Factory.connect(tokenAddress, connectedWallet);
  const balances = await Promise.all(
    addresses.map(async (address) => {
      const balance = await erc20.balanceOf(address);
      return ethers.utils.formatUnits(balance, 6);
    })
  );
  return balances;
}
