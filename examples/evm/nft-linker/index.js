'use strict';

const {
    getDefaultProvider,
    utils: { keccak256, defaultAbiCoder },
} = require('ethers');
const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');
const { deployUpgradable } = require('@axelar-network/axelar-gmp-sdk-solidity');

const ERC721 = rootRequire('./artifacts/examples/evm/nft-linker/ERC721Demo.sol/ERC721Demo.json');
const ExampleProxy = rootRequire('./artifacts/examples/evm/Proxy.sol/ExampleProxy.json');
const NftLinker = rootRequire('./artifacts/examples/evm/nft-linker/NftLinker.sol/NftLinker.json');

const tokenId = Math.floor(Math.random() * 1000000000);

async function deploy(chain, wallet, key) {
    chain.erc721 = await deployContract(wallet, ERC721, ['Test', 'TEST']);
    console.log(`Deployed ERC721Demo for ${chain.name} at ${chain.erc721.address}`);

    chain.contract = await deployUpgradable(
        chain.constAddressDeployer,
        wallet,
        NftLinker,
        ExampleProxy,
        [chain.gateway, chain.gasService],
        [],
        defaultAbiCoder.encode(['string'], [chain.name]),
        key,
    );
    console.log(`Deployed NftLinker for ${chain.name} at ${chain.contract.address}`);
}

async function execute(chains, wallet, options) {
    const { source, destination, calculateBridgeFee } = options;

    const getOwnerDetails = async () => {
        const sourceOwner = await source.erc721.ownerOf(tokenId);

        if (sourceOwner !== source.contract.address) {
            return {
                chain: source.name,
                ownerAddress: sourceOwner,
                tokenId: BigInt(tokenId),
            };
        }

        const newTokenId = BigInt(
            keccak256(defaultAbiCoder.encode(['string', 'address', 'uint256'], [source.name, source.erc721.address, tokenId])),
        );

        const destOwner = destination.contract.ownerOf(newTokenId);

        if (destOwner) {
            return { chain: destination.name, ownerAddress: destOwner, tokenId: newTokenId };
        }

        const ownerAddress = await source.erc721.ownerOf(tokenId);
        return {
            chain: source.name,
            ownerAddress,
            tokenId: BigInt(tokenId),
        };
    };

    async function print(tokenId) {
        const owner = await getOwnerDetails();
        console.log(`Token '${tokenId}' was originally minted at ${source.name} is at ${owner.chain}.`);
    }

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    console.log('==== Initially ====');
    await source.erc721.mint(tokenId);
    console.log(`Minted token ID: '${tokenId}' for ${source.name}`);

    await print(tokenId);

    const fee = await calculateBridgeFee(source, destination);

    const owner = await getOwnerDetails();
    const operatorAddress = source.erc721.address;

    // Approve NFT to the NFTLinker contract
    console.log("\n==== Approve NFT to NFTLinker's contract if needed ====");
    const txApprove = await source.erc721.approve(source.contract.address, owner.tokenId);
    console.log("Approved NFT to NFTLinker's contract", txApprove.hash);

    // Send NFT to NFTLinker's contract
    console.log("\n==== Send NFT to NFTLinker's contract ====");
    const sendNftTx = await source.contract.sendNFT(operatorAddress, owner.tokenId, destination.name, wallet.address, { value: fee });
    console.log("Sent NFT to NFTLinker's contract", sendNftTx.hash);

    const destinationTokenId = BigInt(
        keccak256(defaultAbiCoder.encode(['string', 'address', 'uint256'], [source.name, operatorAddress, tokenId])),
    );
    console.log(`Token ID at ${destination.name} will be: '${destinationTokenId}'`);

    while (true) {
        const originalDetails = await destination.contract.original(destinationTokenId);
        if (originalDetails !== '0x') break;
        await sleep(2000);
    }

    console.log('\n==== Verify Result ====');
    await print(tokenId);

    console.log("\n==== Approve NFT to NFTLinker's contract ====");
    const txApprove2 = await destination.contract.approve(destination.contract.address, destinationTokenId);
    console.log("Approved NFT to NFTLinker's contract", txApprove2.hash);

    console.log(`\n==== Send NFT back from '${source.name}' to ${destination.name} ====`);
    console.log('OwnerOf', await destination.contract.ownerOf(destinationTokenId));
    const sendBackNftTx = await destination.contract.sendNFT(
        destination.contract.address,
        destinationTokenId,
        source.name,
        wallet.address,
        {
            value: fee,
        },
    );
    console.log("Sent NFT back to NFTLinker's contract", sendBackNftTx.hash);

    while (true) {
        const owner = await source.erc721.ownerOf(tokenId);
        console.log(owner);
        if (owner === wallet.address) break;
        await sleep(2000);
    }

    console.log('\n==== Verify Result ====');
    await print(tokenId);
}

module.exports = {
    deploy,
    execute,
};
