import { providers, Wallet } from 'ethers';
export const shouldUseMetamask = () => {
    return process.env.NEXT_PUBLIC_USE_METAMASK == 'true' && typeof window === 'object';
};

export const getMetamaskProvider = () => {
    return new providers.Web3Provider((window as any).ethereum, "any") as providers.Web3Provider;
};
