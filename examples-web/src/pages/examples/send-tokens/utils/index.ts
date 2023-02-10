import { Contract, ethers, getDefaultProvider, providers } from 'ethers';
import {IERC20__factory as IERC20, IAxelarGateway__factory as IAxelarGateway} from 'types/contracts/factories/@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces'
import { isTestnet, wallet } from 'config/constants';
import {depositAddressSendToken} from './depositAddressSendToken';
import {gatewaySendToken} from './gatewaySendToken';

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

export function truncatedAddress(address: string): string {
    return address.substring(0, 6) + '...' + address.substring(address.length - 4);
}

export async function getBalance(addresses: string[], isSource: boolean) {
    const contract = isSource ? srcGatewayContract : destGatewayContract;
    const connectedWallet = isSource ? ethereumConnectedWallet : avalancheConnectedWallet;
    const tokenAddress = await contract.tokenAddresses('aUSDC');
    const erc20 = new Contract(tokenAddress, IERC20.abi, connectedWallet);
    const balances = await Promise.all(
        addresses.map(async (address) => {
            const balance = await erc20.balanceOf(address);
            return ethers.utils.formatUnits(balance, 6);
        }),
    );
    return balances;
}

export { depositAddressSendToken, gatewaySendToken}
