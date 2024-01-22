'use strict';

const { getDefaultProvider, Wallet } = require('ethers');
const { configPath } = require('../../../config');

async function bidRemote(sourceChain, destinationChain, privateKey, tokenId, amount, options = null) {
    const provider = getDefaultProvider(sourceChain.rpc);
    const wallet = new Wallet(privateKey, provider);
    const usdc = sourceChain.usdc;
    const auctionhouse = sourceChain.contract;

    const destinationAuctionhouse = destinationChain.contract;
    console.log(destinationChain.erc721);
    const lastBid = await destinationAuctionhouse.bids(destinationChain.erc721, tokenId);

    if (amount === 0) {
        const minAmount = await destinationAuctionhouse.minAmounts(destinationChain.erc721, tokenId);

        if (lastBid === 0) {
            amount = BigInt(minAmount) === BigInt(await destinationAuctionhouse.NO_MIN()) ? 3e6 : minAmount;
        } else {
            amount = Math.floor((lastBid * 4) / 3 + 1);
        }
    }

    const bridgeFee = await options.calculateBridgeFee(sourceChain, destinationChain);

    const fee = (await options?.getFee(sourceChain, destinationChain, 'aUSDC')) || 1e6;
    await (await usdc.approve(auctionhouse.address, amount + fee)).wait();
    await (
        await auctionhouse.bidRemote(
            destinationChain.name,
            destinationChain.contract.address,
            destinationChain.erc721,
            tokenId,
            wallet.address,
            BigInt(amount + fee),
            { value: bridgeFee },
        )
    ).wait();

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    while (true) {
        const currentBid = await destinationAuctionhouse.bids(destinationChain.erc721, tokenId);
        // console.log(`Waiting for bid... Last bid: ${lastBid}, currentBid: ${currentBid}.`);
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
        temp = require(configPath.localEvmChains);
    } else {
        try {
            temp = require(`@axelar-network/axelar-chains-config`).getChainArray('testnet');
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
