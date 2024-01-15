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

const tokenId = 1000;

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

    await (await chain.erc721.mint(tokenId)).wait();
    console.log(`Minted token ID: '${tokenId}' for ${chain.name}`);
}

async function execute(chains, wallet, options) {
    const { source, destination, calculateBridgeFee } = options;

    console.log('==== Print All Addresses: ====');
    console.log('source.erc721.address', source.erc721.address);
    console.log('source.contract.address', source.contract.address);
    console.log('wallet.address', wallet.address);

    const getOwnerDetails = async () => {
        const newTokenId = BigInt(
            keccak256(defaultAbiCoder.encode(['string', 'address', 'uint256'], [source.name, source.erc721.address, tokenId])),
        );

        const originalDetails = await destination.contract.original(newTokenId);

        // It's minted at the remote chain
        if (originalDetails !== '0x') {
            const ownerAddress = await destination.contract.ownerOf(newTokenId);
            return { chain: destination.name, ownerAddress, tokenId: newTokenId };
        }

        const ownerAddress = await source.erc721.ownerOf(tokenId);
        return {
            chain: source.name,
            ownerAddress,
            tokenId: BigInt(tokenId),
        };
    };

    async function print() {
        const owner = await getOwnerDetails();
        console.log(`Token that was originally minted at ${source.name} is at ${owner.chain}.`);
    }

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // console.log('OWNER', owner);
    // const tokenChain = chains.find((chain) => chain.name === owner.chain);
    // console.log(`Token is currently at ${source.name}`, destination.name);
    // if (source.name === destination.name) throw new Error('Token is already where it should be!');

    console.log('--- Initially ---');
    await print();

    const fee = await calculateBridgeFee(source, destination);

    const owner = await getOwnerDetails();
    const isMintedAtOrigin = owner.chain === source.name;
    const operatorAddress = isMintedAtOrigin ? source.erc721.address : source.contract.address;

    console.log('Owner', owner, isMintedAtOrigin);

    // Approve NFT to the NFTLinker contract
    if (isMintedAtOrigin) {
        await source.erc721.approve(source.contract.address, owner.tokenId);
        console.log("Approved NFT to NFTLinker's contract");
    }

    // Send NFT to NFTLinker's contract
    console.log('Sending NFT', operatorAddress, owner.tokenId, destination.name, wallet.address, fee);
    const sendNftTx = await source.contract.sendNFT(operatorAddress, owner.tokenId, destination.name, wallet.address, { value: fee });
    console.log("Sent NFT to NFTLinker's contract", sendNftTx.hash);

    while (true) {
        // const owner = await getOwnerDetails();
        const newTokenId = BigInt(
            keccak256(defaultAbiCoder.encode(['string', 'address', 'uint256'], [source.name, operatorAddress, tokenId])),
        );

        console.log('Waiting for NFT to be minted at destination chain', newTokenId.toString());

        const originalDetails = await destination.contract.original(newTokenId);
        console.log('originalDetails', originalDetails);
        // console.log(`Token is now at ${owner.chain}.`, newOwnerAddress);
        await sleep(2000);
        if (originalDetails !== '0x') break;
    }

    console.log('--- Then ---');
    await print();
}

module.exports = {
    deploy,
    execute,
};
