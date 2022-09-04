import { providers, Wallet } from 'ethers';
import { getMetamaskProvider, shouldUseMetamask } from '../utils/shouldUseMetamask';
import { switchMetamaskChain } from '../utils/switchMetamaskChain';

if (typeof window === 'undefined') {
    require('dotenv').config();
}

function getDeployerWallet() {
    const mnemonic = process.env.NEXT_PUBLIC_EVM_MNEMONIC as string;
    const privateKey = process.env.NEXT_PUBLIC_EVM_PRIVATE_KEY as string;
    return privateKey ? new Wallet(privateKey) : Wallet.fromMnemonic(mnemonic);
}

export async function getSenderWallet(chain: any) {
    if (shouldUseMetamask()) {
        const { ethereum } = window as any;
        const { chainId, rpc, name, tokenSymbol } = chain;
        await switchMetamaskChain(chainId, rpc, name, tokenSymbol);
        await ethereum.request({ method: 'eth_requestAccounts' });
        return getMetamaskProvider().getSigner();
    }
    const mnemonic = process.env.NEXT_PUBLIC_EVM_MNEMONIC as string;
    const privateKey = process.env.NEXT_PUBLIC_EVM_PRIVATE_KEY as string;
    return privateKey ? new Wallet(privateKey) : Wallet.fromMnemonic(mnemonic);
}

export const isTestnet = process.env.NEXT_PUBLIC_ENVIRONMENT === 'testnet';
export const deployerWallet = getDeployerWallet();
