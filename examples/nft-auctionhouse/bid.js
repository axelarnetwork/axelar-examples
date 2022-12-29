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

const ERC721 = require('../../artifacts/examples/nft-auctionhouse/ERC721Demo.sol/ERC721Demo.json');
const NftAuctionhouse = require('../../artifacts/examples/nft-auctionhouse/NftAuctionhouseRemote.sol/NftAuctionhouseRemote.json');
const IAxelarGateway = require('../../artifacts/@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol/IAxelarGateway.json');
const IERC20 = require('../../artifacts/@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol/IERC20.json');

async function bid(chain, private_key, tokenId, amount) {
    const provider = getDefaultProvider(chain.rpc);
    const wallet = new Wallet(private_key, provider);
    const erc721 = new Contract(chain.erc721, ERC721.abi, wallet);
    const gateway = new Contract(chain.gateway, IAxelarGateway.abi, wallet);
    const usdc = new Contract(await gateway.tokenAddresses('aUSDC'), IERC20.abi, wallet);
    const auctionhouse = new Contract(chain.nftAuctionhouse, NftAuctionhouse.abi, wallet);
    if (amount == 0) {
        const bid = await auctionhouse.bids(erc721.address, tokenId);
        const minAmount = await auctionhouse.minAmounts(erc721.address, tokenId);
        if (bid == 0) {
            amount = minAmount == BigInt(await auctionhouse.NO_MIN()) ? 100 : minAmount;
        } else {
            amount = Math.floor((bid * 4) / 3 + 1);
        }
    }
    await await usdc.approve(auctionhouse.address, amount);
    await await auctionhouse.bid(erc721.address, tokenId, amount);
}

module.exports = bid;

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

    const chainName = args[0];
    const private_key = args[1];
    const tokenId = BigInt(args[2]);
    const amount = BigInt(args[3] || 0);
    const chain = chains.find((chain) => chain.name == chainName);

    bid(chain, private_key, tokenId, amount);
}
