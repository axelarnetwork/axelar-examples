import {
  AxelarQueryAPI,
  Environment,
  EvmChain,
  GasToken,
} from "@axelar-network/axelarjs-sdk";
import { ERC721Demo__factory as ERC721 } from "types/factories/contracts/nft-linker/ERC721demo.sol";
import { NftLinker__factory as NftLinker } from "types/factories/contracts/nft-linker/NFTLinker.sol";
import {
  isTestnet,
  wallet,
  destChain,
  srcChain,
  srcConnectedWallet,
  destConnectedWallet,
} from "config/constants";
import { defaultAbiCoder, keccak256 } from "ethers/lib/utils";

const tokenId = 0;

const srcNftLinker = NftLinker.connect(srcChain.nftLinker, srcConnectedWallet);
const srcErc721 = ERC721.connect(srcChain.erc721, srcConnectedWallet);
const destNftLinker = NftLinker.connect(
  destChain.nftLinker,
  destConnectedWallet
);
const destErc721 = ERC721.connect(destChain.erc721, destConnectedWallet);

export async function sendNftToDest(
  onSrcConfirmed: (txHash: string) => void,
  onSent: (ownerInfo: any) => void
) {
  const owner = await ownerOf();
  const gasFee = getGasFee(srcChain.name, destChain.name, srcChain.tokenSymbol);

  await srcErc721
    .approve(srcNftLinker.address, owner.tokenId || tokenId)
    .then((tx: any) => tx.wait());

  const tx = await (
    await srcNftLinker.sendNFT(
      srcErc721.address,
      owner.tokenId || tokenId,
      destChain.name,
      wallet.address,
      {
        value: gasFee,
      }
    )
  ).wait();

  onSrcConfirmed(tx.transactionHash);

  while (true) {
    const owner = await ownerOf();

    if (owner.chain === destChain.name) {
      onSent(owner);
      break;
    }

    await sleep(2000);
  }
}

export async function sendNftBack(
  onSrcConfirmed: (txHash: string) => void,
  onSent: (ownerInfo: any) => void
) {
  const owner = await ownerOf();

  const gasFee = getGasFee(
    destChain.name,
    srcChain.name,
    destChain.tokenSymbol
  );

  const tx = await (
    await destNftLinker.sendNFT(
      destNftLinker.address,
      owner.tokenId || tokenId,
      srcChain.name,
      wallet.address,
      {
        value: gasFee,
      }
    )
  ).wait();

  onSrcConfirmed(tx.transactionHash);

  while (true) {
    // console.log(await srcNftLinker.hello());
    const owner = await ownerOf();

    if (owner.chain === srcChain.name) {
      onSent(owner);
      break;
    }

    await sleep(2000);
  }
}

export const ownerOf = async (chain = srcChain) => {
  const operator = chain.name === srcChain.name ? srcErc721 : destErc721;
  const nftLinker = chain.name === srcChain.name ? srcNftLinker : destNftLinker;
  const owner = await operator.ownerOf(tokenId);
  const metadata = await operator.tokenURI(tokenId);

  if (owner !== nftLinker.address) {
    return {
      chain: chain.name,
      address: owner,
      tokenId: BigInt(tokenId),
      tokenURI: metadata,
    };
  }

  const newTokenId = BigInt(
    keccak256(
      defaultAbiCoder.encode(
        ["string", "address", "uint256", "string"],
        [chain.name, operator.address, tokenId, metadata]
      )
    )
  );

  for (const checkingChain of [srcChain, destChain]) {
    if (checkingChain === chain) continue;

    const nftLinker = checkingChain.name === srcChain.name ? srcNftLinker : destNftLinker;

    try {
      const address = await nftLinker.ownerOf(newTokenId.toString());
      return {
        chain: checkingChain.name,
        address,
        tokenId: newTokenId.toString(),
        tokenURI: metadata,
      };
    } catch (e) {

    }
  }

  return { chain: "" };
};

const getGasFee = async (
  sourceChainName: EvmChain,
  destinationChainName: EvmChain,
  sourceChainTokenSymbol: GasToken | string
) => {
  const api = new AxelarQueryAPI({ environment: Environment.TESTNET });
  const gasFee = isTestnet
    ? await api.estimateGasFee(
        sourceChainName,
        destinationChainName,
        sourceChainTokenSymbol
      )
    : 3e6;
  return gasFee;
};

export function sleep(ms: number) {
  return new Promise((resolve) => {
      setTimeout(() => {
          resolve(null);
      }, ms);
  });
}
