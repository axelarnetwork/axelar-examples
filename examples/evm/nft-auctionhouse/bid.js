'use strict';

const { config } = require('dotenv');
const { getDefaultProvider, Contract, Wallet } = require('ethers');

const ERC721 = rootRequire('./artifacts/examples/evm/nft-auctionhouse/ERC721Demo.sol/ERC721Demo.json');

async function bid(chain, privateKey, tokenId, amount) {
    const provider = getDefaultProvider(chain.rpc);
    const wallet = new Wallet(privateKey, provider);
    const erc721 = new Contract(chain.erc721, ERC721.abi, wallet);
    const usdc = chain.usdc;
    const auctionhouse = chain.contract;

    if (amount === 0) {
        const bid = await auctionhouse.bids(erc721.address, tokenId);
        const minAmount = await auctionhouse.minAmounts(erc721.address, tokenId);

        if (bid === 0) {
            amount = minAmount === BigInt(await auctionhouse.NO_MIN()) ? 100 : minAmount;
        } else {
            amount = Math.floor((bid * 4) / 3 + 1);
        }
    }

    await await usdc.approve(auctionhouse.address, amount).then((tx) => tx.wait());
    await await auctionhouse.bid(erc721.address, tokenId, amount).then((tx) => tx.wait());
}

module.exports = bid;

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

    const chainName = args[0];
    const private_key = args[1];
    const tokenId = BigInt(args[2]);
    const amount = BigInt(args[3] || 0);
    const chain = chains.find((chain) => chain.name == chainName);

    bid(chain, private_key, tokenId, amount);
}
