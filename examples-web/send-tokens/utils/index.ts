import { Contract, ethers, getDefaultProvider, providers } from 'ethers';
import { AxelarAssetTransfer, AxelarQueryAPI, Environment, EvmChain, GasToken } from '@axelar-network/axelarjs-sdk';
import { keccak256, id } from 'ethers/lib/utils';
import { Wallet } from 'ethers';
import http from 'http';

import AxelarGatewayContract from '../artifacts/@axelar-network/axelar-cgp-solidity/contracts/interfaces/IAxelarGateway.sol/IAxelarGateway.json';
import IERC20 from '../artifacts/@axelar-network/axelar-cgp-solidity/contracts/interfaces/IERC20.sol/IERC20.json';
import { isTestnet, wallet } from '../config/constants';

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

export function generateRecipientAddress(): string {
    return ethers.Wallet.createRandom().address;
}

export async function depositAddressSendToken(amount: string, recipientAddress: string, onSent: (txhash: string) => void) {
    let depositAddress;
    if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'local') {
        depositAddress = await getDepositAddressLocal(avalancheChain.name, moonbeamChain.name, recipientAddress, 'aUSDC', 8500);
    } else {
        const api = new AxelarAssetTransfer({ environment: Environment.TESTNET });
        depositAddress = await api.getDepositAddress('avalanche', 'moonbeam', recipientAddress, 'uausdc');
    }

    console.log("deposit address",depositAddress)

    // Get token address from the gateway contract for the src chain
    const srcTokenAddress = await srcGatewayContract.tokenAddresses('aUSDC');
    const srcErc20 = new Contract(srcTokenAddress, IERC20.abi, avalancheConnectedWallet);

    // Get token address from the gateway contract for the destination chain
    const destinationTokenAddress = await destGatewayContract.tokenAddresses('aUSDC');
    const destERC20 = new Contract(destinationTokenAddress, IERC20.abi, moonbeamConnectedWallet);

    const destBalance = await destERC20.balanceOf(recipientAddress);

    // Send the token
    const txHash = await srcErc20.transfer(depositAddress, ethers.utils.parseUnits(amount, 6))
        .then((tx: any) => tx.wait())
        .then((receipt: any) => receipt.transactionHash);

    console.log({ txHash });
    onSent(txHash);

    // Wait destination contract to execute the transaction.
    return new Promise(async (resolve, reject) => {
        while (true) {
            const newBalance = await destERC20.balanceOf(recipientAddress);
            if (BigInt(destBalance) != BigInt(newBalance)) break;
            await sleep(2000);
        }
        resolve(null);
    });
}
export async function gatewaySendToken(amount: string, recipientAddress: string, onSent: (txhash: string) => void) {
    // Get token address from the gateway contract for the src chain
    const srcTokenAddress = await srcGatewayContract.tokenAddresses('aUSDC');
    const srcErc20 = new Contract(srcTokenAddress, IERC20.abi, avalancheConnectedWallet);

    // Get token address from the gateway contract for the destination chain
    const destinationTokenAddress = await destGatewayContract.tokenAddresses('aUSDC');
    const destERC20 = new Contract(destinationTokenAddress, IERC20.abi, moonbeamConnectedWallet);

    const destBalance = await destERC20.balanceOf(recipientAddress);

    console.log('dest balance', destBalance);

    // Approve the token for the amount to be sent
    await srcErc20.approve(srcGatewayContract.address, ethers.utils.parseUnits(amount, 6)).then((tx: any) => tx.wait());

    // Send the token
    const txHash = await srcGatewayContract
        .sendToken('Moonbeam', recipientAddress, 'aUSDC', ethers.utils.parseUnits(amount, 6))
        .then((tx: any) => tx.wait())
        .then((receipt: any) => receipt.transactionHash);

    console.log({ txHash });
    onSent(txHash);

    // Wait destination contract to execute the transaction.
    return new Promise(async (resolve, reject) => {
        while (true) {
            const newBalance = await destERC20.balanceOf(recipientAddress);
            if (BigInt(destBalance) != BigInt(newBalance)) break;
            await sleep(2000);
        }
        resolve(null);
    });
}

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

function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(null);
        }, ms);
    });
}

export const httpGet = (url: string) => {
    return;
};

const depositAddresses: any = {};

export function getDepositAddressLocal(
    from: any | string,
    to: any | string,
    destinationAddress: string,
    symbol: string,
    port: number | undefined = undefined
) {
    if (typeof from != 'string') from = from.name;
    if (typeof to != 'string') to = to.name;
    if (!port) {
        const key = keccak256(id(from + ':' + to + ':' + destinationAddress + ':' + symbol));
        const address = new Wallet(key).address;
        depositAddresses[from] = {
            [address]: {
                destinationChain: to,
                destinationAddress: destinationAddress,
                tokenSymbol: symbol,
                privateKey: key,
            },
        };
        return address;
    }
    const url = `http://localhost:${port}/getDepositAddress/${from}/${to}/${destinationAddress}/${symbol}`;
    return new Promise((resolve, reject) => {
        fetch(url)
            .then((res) => res.json())
            .then((data) => resolve(data));
    });
}
