'use strict';

const { getDefaultProvider, Contract, Wallet, constants: { AddressZero }, utils: { keccak256, defaultAbiCoder } } = require('ethers');
const { utils: { deployContract }} = require('@axelar-network/axelar-local-dev');
const mint = require('./mint');
const ownerOf = require('./ownerOf');
const bid = require('./bid');
const auction = require('./auction');
const resolveAuction = require('./resolveAuction');

const ERC721 = require('../../build/ERC721Demo.json');
const NftAuctionHouse = require('../../build/NftAuctionHouse.json');
const IERC20 = require('../../build/IERC20.json');
const IAxelarGateway = require('../../build/IAxelarGateway.json');

const tokenId = 0;

async function deploy(chain, wallet) {
    console.log(`Deploying ERC721Demo for ${chain.name}.`);
    const erc721 = await deployContract(wallet, ERC721, ['Test', 'TEST']);
    chain.erc721 = erc721.address;
    console.log(`Deployed ERC721Demo for ${chain.name} at ${chain.erc721}.`);
    console.log(`Deploying NftAuctionhouse for ${chain.name}.`);
    const gateway = new Contract(chain.gateway, IAxelarGateway.abi, wallet);
    const contract = await deployContract(wallet, NftAuctionHouse, [await gateway.tokenAddresses('aUSDC')]);
    chain.nftAuctionhouse = contract.address;
    console.log(`Deployed NftAuctionhouse for ${chain.name} at ${chain.nftAuctionhouse}.`);
}

async function postDeploy(chain, chains, wallet) {
    /*const contract = new Contract(chain.nftLinker, NftLinker.abi, wallet);
    for(const otherChain of chains) {
        if(chain == otherChain) continue;
        console.log(`Linking ${chain.name} -> ${otherChain.name}.`);
        await (await contract.addLinker(otherChain.name, otherChain.nftLinker)).wait();
        console.log(`Linked ${chain.name} -> ${otherChain.name}.`);
    }*/
}

async function test(chains, wallet, options) {
    const args = options.args || [];
    for(const chain of chains) {
        chain.provider = getDefaultProvider(chain.rpc);
        chain.wallet = wallet.connect(chain.provider);
        chain.auctionhouse = new Contract(chain.nftAuctionhouse, NftAuctionHouse.abi, chain.wallet);
        chain.erc721contract = new Contract(chain.erc721, ERC721.abi, chain.wallet);
        
        const gateway = new Contract(chain.gateway, IAxelarGateway.abi, chain.wallet);
        chain.usdc = new Contract(await gateway.tokenAddresses('aUSDC'), IERC20.abi, chain.wallet);
    }

    const firstUnminted = async (chain) => {
        for(let i = 0; true; i++) {
            try{
                await chain.erc721contract.ownerOf(i);
            } catch(e) {
                return i;
            }
        }
    }
    const chain = chains.find(chain => chain.name == (args[0] || 'Ethereum'));
    const tokenId = args[1] || await firstUnminted(chain);
    console.log(tokenId);
    function sleep(ms) {
        return new Promise((resolve)=> {
            setTimeout(() => {resolve()}, ms);
        })
    }
    const auctioneer = new Wallet(keccak256(defaultAbiCoder.encode(['string'], ['auctioneer'])) , chain.provider);

    console.log(`Funding Auctioneer ${auctioneer.address}`);
    await (await chain.wallet.sendTransaction({
        to: auctioneer.address,
        value: BigInt(1e18),
    })).wait();
    const bidders = [];
    for(let i=0; i<5; i++) {
        const bidder = new Wallet(keccak256(defaultAbiCoder.encode(['string'], ['bidder-'+i])), chain.provider)
        
        console.log(`Funding Bidder ${bidder.address}`);
        await (await chain.wallet.sendTransaction({
            to: bidder.address,
            value: BigInt(1e18),
        })).wait();
        await (await chain.usdc.transfer(bidder.address, 1e6)).wait();
        bidders.push(bidder);
    }
    

    async function print() {
        console.log(`Auctioneer has ${await chain.usdc.balanceOf(auctioneer.address)}.`);
        for(const i in bidders) {
            const bidder = bidders[i]
            console.log(`Bidder ${i} has ${await chain.usdc.balanceOf(bidder.address)}.`);
        }
    }

    await print();

    console.log(`Minting ${tokenId}`);
    await mint(chain, auctioneer.privateKey, tokenId);
    console.log(`Auctioning ${tokenId}`);
    await auction(chain, auctioneer.privateKey, tokenId, Math.floor(new Date().getTime() / 1000 + 1));

    for(const bidder of bidders) {
        console.log(`${bidder.address} is bidding.`);
        const balance = await chain.usdc.balanceOf(bidder.address);
        await bid(chain, bidder.privateKey, tokenId, 0);
        const spent = balance - await chain.usdc.balanceOf(bidder.address);
        console.log(`Bid ${spent}.`);
    }
    await sleep(2000);
    await (await chain.wallet.sendTransaction({
        to: wallet.address,
        value: 0,
    })).wait();
    
    await resolveAuction(chain, wallet.privateKey, tokenId);
    console.log(`${await ownerOf(chain, tokenId)} won the auction.`);
    await print();
}

module.exports = {
    deploy,
    test,
    postDeploy,
}
