export const switchMetamaskChain = async (chainId: number, rpcUrl: string, chainName: string, nativeCxy: string) => {
    const { ethereum } = window as any;
    console.log("call switchc hain",chainId);
    await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
            {
                chainId: `0x${chainId.toString(16)}`,
                rpcUrls: [rpcUrl],
                chainName,
                nativeCurrency: {
                    name: nativeCxy,
                    symbol: nativeCxy,
                    decimals: 18,
                },
            },
        ],
    });
};
