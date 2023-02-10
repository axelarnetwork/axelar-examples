import { ethers, getDefaultProvider, providers } from 'ethers';
import { AxelarAssetTransfer, Environment } from '@axelar-network/axelarjs-sdk';
import { IERC20__factory as IERC20, IAxelarGateway__factory as IAxelarGateway } from 'types/contracts/factories/@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces'
import { isTestnet, wallet } from 'config/constants';
import { getDepositAddressLocal } from './getDepositAddressLocal';
import { sleep } from './sleep';
import { getTransferFee } from './getTransferFee';

const chains = isTestnet
  ? require("../../../../../config/testnet.json")
  : require("../../../../../config/chains.json");

const ethereum = chains.find((chain: any) => chain.name === 'Ethereum') as any;
const avalanche = chains.find((chain: any) => chain.name === 'Avalanche') as any;

if (!ethereum || !avalanche) process.exit(0);

const useMetamask = false; // typeof window === 'object';

const ethereumProvider = useMetamask ? new providers.Web3Provider((window as any).ethereum) : getDefaultProvider(ethereum.rpc);
const ethereumConnectedWallet = useMetamask ? (ethereumProvider as providers.Web3Provider).getSigner() : wallet.connect(ethereumProvider);
const avalancheProvider = getDefaultProvider(avalanche.rpc);
const avalancheConnectedWallet = wallet.connect(avalancheProvider);

const srcGatewayContract = IAxelarGateway.connect(ethereum.gateway, ethereumConnectedWallet);
const destGatewayContract = IAxelarGateway.connect(avalanche.gateway, avalancheConnectedWallet);

export async function depositAddressSendToken(
    amount: string,
    recipientAddress: string,
    onSent: (data: { txHash: string; depositAddress: string; transferFee: number }) => void,
) {
    let depositAddress: string;

    if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'testnet') {
      const api = new AxelarAssetTransfer({ environment: Environment.TESTNET });
      depositAddress = await api.getDepositAddress('ethereum', 'avalanche', recipientAddress, 'uausdc');
    } else {
      depositAddress = (await getDepositAddressLocal(ethereum.name, avalanche.name, recipientAddress, 'aUSDC', 8500)) as string;
    }

    // Get token address from the gateway contract for the src chain
    const srcTokenAddress = await srcGatewayContract.tokenAddresses('aUSDC');
    const srcErc20 = IERC20.connect(srcTokenAddress, ethereumConnectedWallet);

    // Get token address from the gateway contract for the destination chain
    const destinationTokenAddress = await destGatewayContract.tokenAddresses('aUSDC');
    const destERC20 = IERC20.connect(destinationTokenAddress, avalancheConnectedWallet);

    const destBalance = await destERC20.balanceOf(recipientAddress);

    const transferFee: number = await getTransferFee('ethereum', 'avalanche', 'aUSDC', amount);

    // Send the token
    const txHash = await srcErc20
        .transfer(depositAddress, ethers.utils.parseUnits(amount, 6))
        .then((tx: any) => tx.wait())
        .then((receipt: any) => receipt.transactionHash);

    onSent({ txHash, depositAddress, transferFee });

    // Wait destination contract to execute the transaction.
    while (true) {
      const newBalance = await destERC20.balanceOf(recipientAddress);
      if (!destBalance.eq(newBalance)) break;
      await sleep(2000);
    }
}
