'use strict';

const { getDefaultProvider, Contract, constants: { AddressZero }, utils: { keccak256, defaultAbiCoder }, Wallet } = require('ethers');
const { utils: { deployContract }} = require('@axelar-network/axelar-local-dev');

const ERC721 = require('../../build/ERC721Demo.json');
const NftAuctionhouse = require('../../build/NftAuctionhouseRemote.json');
const IERC20 = require('../../build/IERC20.json');
const IAxelarGateway = require('../../build/IAxelarGateway.json');



async function bidRemote (sourceChain, destinationChain, private_key, tokenId, amount, options = null) {
    const provider = getDefaultProvider(sourceChain.rpc);
    const wallet = new Wallet(private_key, provider);
    const gateway = new Contract(sourceChain.gateway, IAxelarGateway.abi, wallet);
    const usdc = new Contract(await gateway.tokenAddresses('aUSDC'), IERC20.abi, wallet);
    const auctionhouse = new Contract(sourceChain.nftAuctionhouse, NftAuctionhouse.abi, wallet);

    if(amount == 0) {   
        const destinationProvider = getDefaultProvider(destinationChain.rpc);
        const auctionhouse = new Contract(destinationChain.nftAuctionhouse, NftAuctionhouse.abi, destinationProvider);
        const bid = await auctionhouse.bids(destinationChain.erc721, tokenId);
        const minAmount = await auctionhouse.minAmounts(destinationChain.erc721, tokenId);
        if(bid == 0) {
            amount = BigInt(minAmount) == BigInt(await auctionhouse.NO_MIN()) ? 100 : minAmount;
        } else {
            amount = Math.floor(bid * 4 / 3 + 1);
        }
    }
    const gasLimit = 3e5;
    const gasPrice = await options?.getGasPrice(sourceChain, destinationChain, AddressZero) || 1;

    const fee = await options?.getFee(sourceChain, destinationChain, 'aUSDC') || 1e6;
    await (await usdc.approve(auctionhouse.address, amount+fee)).wait();
    console.log(
        destinationChain.name, 
        destinationChain.nftAuctionhouse,
        destinationChain.erc721, 
        tokenId, 
        wallet.address,
        amount+fee,
        {value: gasLimit * gasPrice}
    );
    await (await auctionhouse.bidRemote(
        destinationChain.name, 
        destinationChain.nftAuctionhouse,
        destinationChain.erc721, 
        tokenId, 
        wallet.address,
        BigInt(amount+fee),
        {value: gasLimit * gasPrice}
    )).wait();
}


module.exports = bidRemote;

if (require.main === module) {
    const env = process.argv[2];
    if(env == null || (env != 'testnet' && env != 'local')) throw new Error('Need to specify tesntet or local as an argument to this script.');
    let temp;
    if(env == 'local') {
        temp = require(`../../info/local.json`);
    } else {
        try {
            temp = require(`../../info/testnet.json`);
        } catch {
            temp = testnetInfo;
        }
    }
    const chains = temp;
    const args = process.argv.slice(3);

    const sourceChainName = args[0];
    const destinationChainName = args[1];
    const private_key = args[2];
    const tokenId = BigInt(args[3]);
    const amount = BigInt(args[4] || 0);
    const sourceChain = chains.find(chain => chain.name == sourceChainName);
    const destinationChain = chains.find(chain => chain.name == destinationChainName);
    bidRemote(sourceChain, destinationChain, private_key, tokenId, amount);
}