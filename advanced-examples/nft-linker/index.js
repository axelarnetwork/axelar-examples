'use strict';

const { getDefaultProvider, Contract, constants: { AddressZero } } = require('ethers');
const { utils: { deployContract }} = require('@axelar-network/axelar-local-dev');

const ERC721 = require('../../build/ERC721Demo.json');
const NftLinker = require('../../build/NftLinker.json');

const tokenId = 0;

async function deploy(chain, wallet) {
    console.log(`Deploying ERC721Demo for ${chain.name}.`);
    const erc721 = await deployContract(wallet, ERC721, ['Test', 'TEST']);
    chain.erc721 = erc721.address;
    console.log(`Deployed ERC721Demo for ${chain.name} at ${chain.erc721}.`);
    console.log(`Deploying NftLinker for ${chain.name}.`);
    const contract = await deployContract(wallet, NftLinker, [chain.name, chain.gateway, chain.gasReceiver]);
    chain.nftLinker = contract.address;
    console.log(`Deployed NftLinker for ${chain.name} at ${chain.nftLinker}.`);
    console.log(`Minting token ${tokenId} for ${chain.name}`);
    await (await erc721.mint(tokenId)).wait();
    console.log(`Minted token ${tokenId} for ${chain.name}`);
}

async function postDeploy(chain, chains, wallet) {
    const contract = new Contract(chain.nftLinker, NftLinker.abi, wallet);
    for(const otherChain of chains) {
        if(chain == otherChain) continue;
        console.log(`Linking ${chain.name} -> ${otherChain.name}.`);
        await (await contract.addLinker(otherChain.name, otherChain.nftLinker)).wait();
        console.log(`Linked ${chain.name} -> ${otherChain.name}.`);
    }
}

async function test(chains, wallet, options) {
    const ownerOf = async (sourceChain, operator, tokenId) => {
        const owner = await operator.ownerOf(tokenId);
        if(owner != sourceChain.nftLinker.address) {
            return {chain: sourceChain.name, address: owner, tokenId: BigInt(tokenId)};
        } else {
            const newTokenId = BigInt(keccak256(defaultAbiCoder.encode(['string', 'address', 'uint256'], [sourceChain.name, operator.address, tokenId])));
            for(let chain of networks) {
                if(chain == sourceChain) continue;
                try {
                    const address = await chain.nftLinker.ownerOf(newTokenId);
                    return {chain: chain.name, address: address, tokenId: newTokenId};
                } catch (e) {}
            }
        }
    }
    
    const args = options.args || [];
    const getGasPrice = options.getGasPrice;
    for(const chain of chains) {
        const provider = getDefaultProvider(chain.rpc);
        chain.wallet = wallet.connect(provider);
        chain.contract = new Contract(chain.nftLinker, NftLinker.abi, chain.wallet);
    }
    const source = chains.find(chain => chain.name == (args[0] || 'Avalanche'));
    const destination = chains.find(chain => chain.name == (args[1] || 'Fantom'));
    const originChain = chains.find(chain => chain.name == (args[2] || 'Avalanche'));

    async function print() {
        console.log(await ownerOf(originChain, originChain.erc721, tokenId));
    }
    function sleep(ms) {
        return new Promise((resolve)=> {
            setTimeout(() => {resolve()}, ms);
        })
    }

    console.log('--- Initially ---');
    await print();

    //Set the gasLimit to 1e6 (a safe overestimate) and get the gas price (this is constant and always 1).
    const gasLimit = 3e5;
    const gasPrice = await getGasPrice(source, destination, AddressZero);
    // Set the value on chain1. This will also cause the value on chain2 to change after relay() is called.
    await (await source.contract.setRemoteValue(
        destination.name,
        destination.executableSample,
        message, 
        {value: BigInt(Math.floor(gasLimit * gasPrice))}
    )).wait();
    while(await destination.contract.value() != message) {
        await sleep(2000);
    }

    console.log('--- After ---');
    await print();
}

module.exports = {
    deploy,
    test,
    postDeploy,
}
