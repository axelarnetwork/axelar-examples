import { Contract, ethers, getDefaultProvider, providers } from 'ethers';
import AxelarGatewayContract from '../abi/IAxelarGateway.sol/IAxelarGateway.json';
import IERC20 from '../abi/IERC20.sol/IERC20.json';
import { isTestnet, wallet } from '../config/constants';
import {depositAddressSendToken} from './depositAddressSendToken';
import {gatewaySendToken} from './gatewaySendToken';

let chains = isTestnet ? require('../config/testnet.json') : require('../config/local.json');

const moonbeamChain = chains.find((chain: any) => chain.name === 'Moonbeam') as any;
const avalancheChain = chains.find((chain: any) => chain.name === 'Avalanche') as any;

if (!moonbeamChain || !avalancheChain) process.exit(0);

const useMetamask = false; // typeof window === 'object';

const moonbeamProvider = useMetamask ? new providers.Web3Provider((window as any).ethereum) : getDefaultProvider(moonbeamChain.rpc);
const moonbeamConnectedWallet = useMetamask ? (moonbeamProvider as providers.Web3Provider).getSigner() : wallet.connect(moonbeamProvider);
const avalancheProvider = getDefaultProvider(avalancheChain.rpc);
const avalancheConnectedWallet = wallet.connect(avalancheProvider);

const srcGatewayContract = new Contract(avalancheChain.gateway, AxelarGatewayContract.abi, avalancheConnectedWallet);
const destGatewayContract = new Contract(moonbeamChain.gateway, AxelarGatewayContract.abi, moonbeamConnectedWallet);

export function truncatedAddress(address: string): string {
    return address.substring(0, 6) + '...' + address.substring(address.length - 4);
}

export async function getBalance(addresses: string[], isSource: boolean) {
    const contract = isSource ? srcGatewayContract : destGatewayContract;
    const connectedWallet = isSource ? avalancheConnectedWallet : moonbeamConnectedWallet;
    const tokenAddress = await contract.tokenAddresses('aUSDC');
    const erc20 = new Contract(tokenAddress, IERC20.abi, connectedWallet);
    const balances = await Promise.all(
        addresses.map(async (address) => {
            const balance = await erc20.balanceOf(address);
            return ethers.utils.formatUnits(balance, 6);
        })
    );
    return balances;
}

export { depositAddressSendToken, gatewaySendToken}