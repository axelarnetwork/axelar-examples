'use strict';

const {
    getDefaultProvider,
    Contract,
    constants: { AddressZero },
    utils: { keccak256, defaultAbiCoder },
} = require('ethers');
const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');
const { deployUpgradable } = require('@axelar-network/axelar-gmp-sdk-solidity');

const ERC721 = require('../../artifacts/examples/nft-linker/ERC721Demo.sol/ERC721Demo.json');
const ExampleProxy = require('../../artifacts/examples/Proxy.sol/ExampleProxy.json');
const NftLinker = require('../../artifacts/examples/nft-linker/NftLinker.sol/NftLinker.json');

const tokenId = 0;

async function deploy(chain, wallet) {
    console.log(`Deploying ERC721Demo for ${chain.name}.`);
    const erc721 = await deployContract(wallet, ERC721, ['Test', 'TEST']);
    chain.erc721 = erc721.address;
    console.log(`Deployed ERC721Demo for ${chain.name} at ${chain.erc721}.`);
    console.log(`Deploying NftLinker for ${chain.name}.`);
    const provider = getDefaultProvider(chain.rpc);
    const contract = await deployUpgradable(
        chain.constAddressDeployer,
        wallet.connect(provider),
        NftLinker,
        ExampleProxy,
        [chain.gateway, chain.gasReceiver],
        [],
        defaultAbiCoder.encode(['string'], [chain.name]),
        'nftLinker',
    );
    chain.nftLinker = contract.address;
    console.log(`Deployed NftLinker for ${chain.name} at ${chain.nftLinker}.`);
    console.log(`Minting token ${tokenId} for ${chain.name}`);
    await (await erc721.mint(tokenId)).wait();
    console.log(`Minted token ${tokenId} for ${chain.name}`);
}

async function test(chains, wallet, options) {
    const args = options.args || [];
    const getGasPrice = options.getGasPrice;
    for (const chain of chains) {
        const provider = getDefaultProvider(chain.rpc);
        chain.wallet = wallet.connect(provider);
        chain.contract = await deployUpgradable(
            chain.constAddressDeployer,
            chain.wallet,
            NftLinker,
            ExampleProxy,
            [chain.gateway, chain.gasReceiver],
            [],
            defaultAbiCoder.encode(['string'], [chain.name]),
            'nftLinker',
        );
        chain.erc721 = new Contract(chain.erc721, ERC721.abi, chain.wallet);
    }
    const destination = chains.find((chain) => chain.name == (args[1] || 'Fantom'));
    const originChain = chains.find((chain) => chain.name == (args[0] || 'Avalanche'));

    const ownerOf = async (chain = originChain) => {
        const operator = chain.erc721;
        const owner = await operator.ownerOf(tokenId);
        if (owner !== chain.contract.address) {
            return { chain: chain.name, address: owner, tokenId: BigInt(tokenId) };
        } else {
            const newTokenId = BigInt(
                keccak256(defaultAbiCoder.encode(['string', 'address', 'uint256'], [chain.name, operator.address, tokenId])),
            );
            for (let checkingChain of chains) {
                if (checkingChain == chain) continue;
                try {
                    const address = await checkingChain.contract.ownerOf(newTokenId);
                    return { chain: checkingChain.name, address: address, tokenId: newTokenId };
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
    function sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, ms);
        });
    }

    const owner = await ownerOf();
    const source = chains.find((chain) => chain.name === owner.chain);
    if (source === destination) throw new Error('Token is already where it should be!');

    console.log('--- Initially ---');
    await print();

    const gasLimit = 1e6;
    const gasPrice = await getGasPrice(source, destination, AddressZero);

    if (originChain === source) {
        await (await source.erc721.approve(source.contract.address, owner.tokenId)).wait();
    }
    await (
        await source.contract.sendNFT(
            originChain === source ? source.erc721.address : source.contract.address,
            owner.tokenId,
            destination.name,
            wallet.address,
            { value: gasLimit * gasPrice },
        )
    ).wait();

    while (true) {
        const owner = await ownerOf();
        if (owner.chain === destination.name) break;
        await sleep(2000);
    }

    console.log('--- Then ---');
    await print();
}

module.exports = {
    deploy,
    test,
};
