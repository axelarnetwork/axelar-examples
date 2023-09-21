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

const NftAuctionhouse = rootRequire('./artifacts/examples/evm/nft-auctionhouse/NftAuctionhouseRemote.sol/NftAuctionhouseRemote.json');

async function getBidder(chain, tokenId) {
    const provider = getDefaultProvider(chain.rpc);
    const contract = new Contract(chain.nftAuctionhouse, NftAuctionhouse.abi, provider);
    return await contract.bidders(chain.erc721, tokenId);
}

module.exports = getBidder;

if (require.main === module) {
    const env = process.argv[2];
    if (env == null || (env != 'testnet' && env != 'local'))
        throw new Error('Need to specify tesntet or local as an argument to this script.');
    let temp;
    if (env == 'local') {
        temp = require(`../../../chain-config/local.json`);
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
    const tokenId = BigInt(args[1]);
    const chain = chains.find((chain) => chain.name == chainName);

    getBidder(chain, tokenId).then((owner) => console.log(owner));
}
