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

async function auction(chain, private_key, tokenId, deadline, min) {
    deadline = deadline || Math.floor(new Date().getTime() / 1000 + 60);
    min = min || 0;
    const provider = getDefaultProvider(chain.rpc);
    const wallet = new Wallet(private_key, provider);
    const erc721 = new Contract(chain.erc721, ERC721.abi, wallet);
    const auctionhouse = new Contract(chain.nftAuctionhouse, NftAuctionhouse.abi, wallet);

    await await erc721.approve(auctionhouse.address, tokenId);

    await await auctionhouse.auction(erc721.address, tokenId, min, deadline);
}

module.exports = auction;

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

    const chain = chains.find((chain) => chain.name == chainName);
    const deadline = BigInt(args[3] || Math.floor(new Date().getTime() / 1000 + 60));
    const min = BigInt(args[4] || 0);

    auction(chain, private_key, tokenId, deadline, min);
}
