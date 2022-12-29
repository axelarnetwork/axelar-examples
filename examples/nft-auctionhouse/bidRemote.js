'use strict';

const {
    getDefaultProvider,
    Contract,
    constants: { AddressZero },
    utils: { keccak256, defaultAbiCoder },
    Wallet,
} = require('ethers');
const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');

const NftAuctionhouse = require('../../artifacts/examples/nft-auctionhouse/NftAuctionhouseRemote.sol/NftAuctionhouseRemote.json');
const IAxelarGateway = require('../../artifacts/@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol/IAxelarGateway.json');
const IERC20 = require('../../artifacts/@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol/IERC20.json');

async function bidRemote(sourceChain, destinationChain, private_key, tokenId, amount, options = null) {
    const provider = getDefaultProvider(sourceChain.rpc);
    const wallet = new Wallet(private_key, provider);
    const gateway = new Contract(sourceChain.gateway, IAxelarGateway.abi, wallet);
    const usdc = new Contract(await gateway.tokenAddresses('aUSDC'), IERC20.abi, wallet);
    const auctionhouse = new Contract(sourceChain.nftAuctionhouse, NftAuctionhouse.abi, wallet);

    const destinationProvider = getDefaultProvider(destinationChain.rpc);
    const destinationAuctionhouse = new Contract(destinationChain.nftAuctionhouse, NftAuctionhouse.abi, destinationProvider);
    const lastBid = await destinationAuctionhouse.bids(destinationChain.erc721, tokenId);

    if (amount == 0) {
        const minAmount = await destinationAuctionhouse.minAmounts(destinationChain.erc721, tokenId);
        if (lastBid == 0) {
            amount = BigInt(minAmount) == BigInt(await destinationAuctionhouse.NO_MIN()) ? 3e6 : minAmount;
        } else {
            amount = Math.floor((lastBid * 4) / 3 + 1);
        }
    }
    const gasLimit = 3e5;
    const gasPrice = (await options?.getGasPrice(sourceChain, destinationChain, AddressZero)) || 1;

    const fee = (await options?.getFee(sourceChain, destinationChain, 'aUSDC')) || 1e6;
    await (await usdc.approve(auctionhouse.address, amount + fee)).wait();
    await (
        await auctionhouse.bidRemote(
            destinationChain.name,
            destinationChain.nftAuctionhouse,
            destinationChain.erc721,
            tokenId,
            wallet.address,
            BigInt(amount + fee),
            { value: gasLimit * gasPrice },
        )
    ).wait();

    function sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, ms);
        });
    }
    while (true) {
        const currentBid = await destinationAuctionhouse.bids(destinationChain.erc721, tokenId);
        //console.log(`Waiting for bid... Last bid: ${lastBid}, currentBid: ${currentBid}.`);
        if (currentBid * 3 > lastBid * 4) break;
        await sleep(1000);
    }
}

module.exports = bidRemote;

if (require.main === module) {
    const env = process.argv[2];
    if (env == null || (env != 'testnet' && env != 'local'))
        throw new Error('Need to specify tesntet or local as an argument to this script.');
    let temp;
    if (env == 'local') {
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
    const sourceChain = chains.find((chain) => chain.name == sourceChainName);
    const destinationChain = chains.find((chain) => chain.name == destinationChainName);
    bidRemote(sourceChain, destinationChain, private_key, tokenId, amount);
}
