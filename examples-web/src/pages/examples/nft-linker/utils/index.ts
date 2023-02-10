import { getDefaultProvider } from 'ethers';
import { AxelarQueryAPI, Environment, EvmChain, GasToken } from '@axelar-network/axelarjs-sdk';
import {ERC721Demo__factory as ERC721} from 'types/contracts/factories/contracts/nft-linker/ERC721demo.sol';
import {NftLinker__factory as NftLinker} from 'types/contracts/factories/contracts/nft-linker/NFTLinker.sol';
import { isTestnet, wallet } from 'config/constants';
import { defaultAbiCoder, keccak256 } from 'ethers/lib/utils';
import { sleep } from './sleep';

const tokenId = 0;

const chains = isTestnet
  ? require("../../../../../config/testnet.json")
  : require("../../../../../config/chains.json");

const ethereum = chains.find((chain: any) => chain.name === 'Ethereum') as any;
const avalanche = chains.find((chain: any) => chain.name === 'Avalanche') as any;

export function updateContractsOnChainConfig(chain: any): void {
    chain.wallet = wallet.connect(getDefaultProvider(chain.rpc));
    chain.contract = NftLinker.connect(chain.nftLinker, chain.wallet);
    chain.erc721 = ERC721.connect(chain.erc721, chain.wallet);
}

updateContractsOnChainConfig(ethereum);
updateContractsOnChainConfig(avalanche);

export async function sendNftToDest(onSrcConfirmed: (txHash: string) => void, onSent: (ownerInfo: any) => void) {
    const owner = await ownerOf();

    console.log({owner})

    console.log('--- Initially ---', owner);
    await print();

    const gasFee = getGasFee(EvmChain.ETHEREUM, EvmChain.AVALANCHE, GasToken.ETH);

    await (await ethereum.erc721.approve(ethereum.contract.address, owner.tokenId)).wait();
    const tx = await (
        await ethereum.contract.sendNFT(ethereum.erc721.address, owner.tokenId, avalanche.name, wallet.address, {
            value: gasFee,
        })
    ).wait();

    console.log('tx', tx);

    onSrcConfirmed(tx.transactionHash);

    while (true) {
        const owner = await ownerOf();

        if (owner.chain === avalanche.name) {
            onSent(owner);
            break;
        }

        await sleep(2000);
    }

    console.log('--- Then ---');
    await print();
}

export async function sendNftBack(onSrcConfirmed: (txHash: string) => void, onSent: (ownerInfo: any) => void) {
    const owner = await ownerOf();

    console.log('--- Initially ---', owner);
    await print();

    const gasFee = getGasFee(EvmChain.AVALANCHE, EvmChain.ETHEREUM, GasToken.AVAX);

    const tx = await (
        await avalanche.contract.sendNFT(avalanche.contract.address, owner.tokenId, ethereum.name, wallet.address, {
            value: gasFee,
        })
    ).wait();

    console.log('tx back', tx);

    onSrcConfirmed(tx.transactionHash);

    while (true) {
        const owner = await ownerOf();

        if (owner.chain === ethereum.name) {
            onSent(owner);
            break;
        }

        await sleep(2000);
    }

    console.log('--- Then ---');
    await print();
}

export function truncatedAddress(address: string): string {
    return address.substring(0, 6) + '...' + address.substring(address.length - 10);
}

export const ownerOf = async (chain = ethereum) => {
    const operator = chain.erc721;
    const owner = await operator.ownerOf(tokenId);
    const metadata = await operator.tokenURI(tokenId);

    if (owner !== chain.contract.address) {
        return { chain: chain.name, address: owner, tokenId: BigInt(tokenId), tokenURI: metadata };
    }

        const newTokenId = BigInt(
            keccak256(defaultAbiCoder.encode(['string', 'address', 'uint256', 'string'], [chain.name, operator.address, tokenId, metadata])),
        );

        for (const checkingChain of [ethereum, avalanche]) {
            if (checkingChain === chain) continue;

            try {
                const address = await checkingChain.contract.ownerOf(newTokenId);
                return { chain: checkingChain.name, address, tokenId: newTokenId, tokenURI: metadata };
            } catch (e) {}
        }

    return { chain: '' };
};

async function print() {
    for (const chain of chains) {
        const owner = await ownerOf(chain);
        console.log(`Token that was originally minted at ${chain.name} is at ${owner.chain}.`);
    }
}

const getGasFee = async (
    sourceChainName: EvmChain,
    destinationChainName: EvmChain,
    sourceChainTokenSymbol: GasToken | string,
    estimatedGasUsed?: number,
) => {
    const api = new AxelarQueryAPI({ environment: Environment.TESTNET });
    const gasFee = isTestnet ? await api.estimateGasFee(sourceChainName, destinationChainName, sourceChainTokenSymbol) : 3e6;
    return gasFee;
};
