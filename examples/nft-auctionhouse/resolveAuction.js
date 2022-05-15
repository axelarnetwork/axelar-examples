'use strict';

const { getDefaultProvider, Contract, constants: { AddressZero }, utils: { keccak256, defaultAbiCoder }, Wallet } = require('ethers');
const { utils: { deployContract }} = require('@axelar-network/axelar-local-dev');

const ERC721 = require('../../build/ERC721Demo.json');
const NftAuctionhouse = require('../../build/NftAuctionhouse.json');

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

const chainName = args[0];
const private_key = args[1];
const tokenId = BigInt(args[2]);
(async () => {
    const chain = chains.find(chain => chain.name == chainName);
    const provider = getDefaultProvider(chain.rpc);
    const wallet = new Wallet(private_key, provider);
    const erc721 = new Contract(chain.erc721, ERC721.abi, wallet);
    const auctionhouse = new Contract(chain.nftAuctionhouse, NftAuctionhouse.abi, wallet);
    
    console.log(await erc721.ownerOf(tokenId));
    await (await auctionhouse.resolveAuction(chain.erc721, tokenId));
    console.log(await erc721.ownerOf(tokenId));
})();