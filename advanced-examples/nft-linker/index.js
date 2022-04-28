'use strict';

const { getDefaultProvider, Contract, constants: { AddressZero }, utils: { keccak256, defaultAbiCoder } } = require('ethers');
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
    
    
    const args = options.args || [];
    const getGasPrice = options.getGasPrice;
    for(const chain of chains) {
        const provider = getDefaultProvider(chain.rpc);
        chain.wallet = wallet.connect(provider);
        chain.contract = new Contract(chain.nftLinker, NftLinker.abi, chain.wallet);
        chain.erc721 = new Contract(chain.erc721, ERC721.abi, chain.wallet);
    }
    const destination = chains.find(chain => chain.name == (args[1] || 'Fantom'));
    const originChain = chains.find(chain => chain.name == (args[0] || 'Avalanche'));

    const ownerOf = async () => {
        const operator = originChain.erc721;
        const owner = await operator.ownerOf(tokenId);
        if(owner != originChain.contract.address) {
            return {chain: originChain.name, address: owner, tokenId: BigInt(tokenId)};
        } else {
            const newTokenId = BigInt(keccak256(defaultAbiCoder.encode(['string', 'address', 'uint256'], [originChain.name, operator.address, tokenId])));
            for(let chain of chains) {
                if(chain == originChain) continue;
                try {
                    const address = await chain.contract.ownerOf(newTokenId);
                    return {chain: chain.name, address: address, tokenId: newTokenId};
                } catch (e) {
                }
            }
        }
        return {chain: ''};
    }

    async function print() {
        console.log(await ownerOf());
    }
    function sleep(ms) {
        return new Promise((resolve)=> {
            setTimeout(() => {resolve()}, ms);
        })
    }

    console.log('--- Initially ---');
    const owner = await ownerOf();
    const source = chains.find(chain => chain.name == (owner.chain));
    if(source == destination) throw new Error('Token is already where it should be!');
    console.log(owner);

    //Set the gasLimit to 1e6 (a safe overestimate) and get the gas price (this is constant and always 1).
    const gasLimit = 1e6;
    const gasPrice = await getGasPrice(source, destination, AddressZero);
    // Set the value on chain1. This will also cause the value on chain2 to change after relay() is called.
    if(originChain == source) {
        await (await source.erc721.approve(source.contract.address, owner.tokenId)).wait(); 
    }
    await (await source.contract.sendNFT(
        originChain == source ? source.erc721.address : source.contract.address, 
        owner.tokenId, 
        destination.name,
        wallet.address,
        {value: gasLimit * gasPrice}
    )).wait(); 

    while(true) {
        const owner = await ownerOf();
        if(owner.chain == destination.name) break;
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
