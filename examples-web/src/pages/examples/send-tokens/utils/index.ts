import { Contract, ethers, getDefaultProvider, providers } from 'ethers';
import {IERC20__factory as IERC20, IAxelarGateway__factory as IAxelarGateway} from 'types/contracts/factories/@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces'
import { srcChain, srcConnectedWallet, destChain, destConnectedWallet } from 'config/constants';
import {depositAddressSendToken} from './depositAddressSendToken';
import {gatewaySendToken} from './gatewaySendToken';

const srcGatewayContract = IAxelarGateway.connect(srcChain.gateway, srcConnectedWallet);
const destGatewayContract = IAxelarGateway.connect(destChain.gateway, destConnectedWallet);

export function truncatedAddress(address: string): string {
    return address.substring(0, 6) + '...' + address.substring(address.length - 4);
}

export async function getBalance(addresses: string[], isSource: boolean) {
    const contract = isSource ? srcGatewayContract : destGatewayContract;
    const connectedWallet = isSource ? srcConnectedWallet : destConnectedWallet;
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

export function sleep(ms: number) {
  return new Promise((resolve) => {
      setTimeout(() => {
          resolve(null);
      }, ms);
  });
}

export { depositAddressSendToken, gatewaySendToken}
