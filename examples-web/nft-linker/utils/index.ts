import { Contract, ethers, getDefaultProvider, providers } from 'ethers';
import { AxelarQueryAPI, Environment, EvmChain, GasToken } from '@axelar-network/axelarjs-sdk';

import ERC721 from '../artifacts/contracts/ERC721demo.sol/ERC721Demo.json';
import NftLinker from '../artifacts/contracts/NFTLinker.sol/NFTLinker.json';
import { isTestnet, wallet } from '../config/constants';
import { defaultAbiCoder, keccak256 } from 'ethers/lib/utils';
import { sleep } from './sleep';

const tokenId = 0;

let chains = isTestnet ? require('../config/testnet.json') : require('../config/local.json');

const moonbeamChain = chains.find((chain: any) => chain.name === 'Moonbeam') as any;
const avalancheChain = chains.find((chain: any) => chain.name === 'Avalanche') as any;

moonbeamChain.wallet = wallet.connect(getDefaultProvider(moonbeamChain.rpc));
moonbeamChain.contract = new Contract(moonbeamChain.nftLinker as string, NftLinker.abi, moonbeamChain.wallet);
moonbeamChain.erc721 = new Contract(moonbeamChain.erc721 as string, ERC721.abi, moonbeamChain.wallet);

avalancheChain.wallet = wallet.connect(getDefaultProvider(avalancheChain.rpc));
avalancheChain.contract = new Contract(avalancheChain.nftLinker as string, NftLinker.abi, avalancheChain.wallet);
avalancheChain.erc721 = new Contract(avalancheChain.erc721 as string, ERC721.abi, avalancheChain.wallet);

export function generateRecipientAddress(): string {
    return ethers.Wallet.createRandom().address;
}

// export async function sendNftToDest(destinationChain = 'Moonbeam', recipientAddress: string, onSent: (txhash: string) => void) {
export async function sendNftToDest(onSent: (txhash: string, ownerInfo: any) => void) {
    const owner = await ownerOf();

    console.log('--- Initially ---',owner);
    await print();

    const gasFee = getGasFee(EvmChain.AVALANCHE, EvmChain.MOONBEAM, GasToken.AVAX);

    await (await avalancheChain.erc721.approve(avalancheChain.contract.address, owner.tokenId)).wait();
    const tx = await (
        await avalancheChain.contract.sendNFT(avalancheChain.erc721.address, owner.tokenId, moonbeamChain.name, wallet.address, {
            value: gasFee,
        })
    ).wait();

    console.log("tx",tx);

    while (true) {
        const owner = await ownerOf();
        if (owner.chain == moonbeamChain.name) {
            onSent(tx.transactionHash, owner);
            break;
        }
        await sleep(2000);
    }

    console.log('--- Then ---');
    await print();
}

export async function sendNftBack(onSent: (txhash: string, ownerInfo: any) => void) {
    const owner = await ownerOf();

    console.log('--- Initially ---',owner);
    await print();

    const gasFee = getGasFee(EvmChain.MOONBEAM, EvmChain.AVALANCHE, GasToken.GLMR);

    const tx = await (
        await moonbeamChain.contract.sendNFT(moonbeamChain.contract.address, owner.tokenId, avalancheChain.name, wallet.address, {
            value: gasFee,
        })
    ).wait();

    console.log("tx back",tx);

    while (true) {
        const owner = await ownerOf();
        if (owner.chain == avalancheChain.name) {
            onSent(tx.transactionHash, owner);
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

export const ownerOf = async (chain = avalancheChain) => {
    const operator = chain.erc721;
    const owner = await operator.ownerOf(tokenId);
    const metadata = await operator.tokenURI(tokenId);

    if (owner != chain.contract.address) {
        return { chain: chain.name, address: owner, tokenId: BigInt(tokenId), tokenURI: metadata };
    } else {
        const newTokenId = BigInt(
            keccak256(defaultAbiCoder.encode(['string', 'address', 'uint256', 'string'], [chain.name, operator.address, tokenId, metadata]))
        );
        for (let checkingChain of [avalancheChain, moonbeamChain]) {
            if (checkingChain == chain) continue;
            try {
                const address = await checkingChain.contract.ownerOf(newTokenId);
                return { chain: checkingChain.name, address: address, tokenId: newTokenId, tokenURI: metadata };
            } catch (e) {}
        }
    }
    return { chain: '' };
};

async function print() {
    for (const chain of chains) {
        const owner = await ownerOf(chain);
        console.log(`Token that was originally minted at ${chain.name} is at ${owner.chain}.`);
    }
}

const getGasFee = async (sourceChainName: EvmChain, destinationChainName: EvmChain, sourceChainTokenSymbol: GasToken | string, estimatedGasUsed?: number) => {
    const api = new AxelarQueryAPI({ environment: Environment.TESTNET });
    const gasFee = isTestnet ? await api.estimateGasFee(sourceChainName, destinationChainName, sourceChainTokenSymbol) : 3e6;
    return gasFee;
}