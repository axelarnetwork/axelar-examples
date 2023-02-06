'use strict';

const { getDefaultProvider, Contract, Wallet } = require('ethers');

const NftAuctionhouse = rootRequire('./artifacts/examples/evm/nft-auctionhouse/NftAuctionhouseRemote.sol/NftAuctionhouseRemote.json');

async function resolveAuction(chain, privateKey, tokenId) {
    const provider = getDefaultProvider(chain.rpc);
    const wallet = new Wallet(privateKey, provider);
    const auctionhouse = new Contract(chain.contract.address, NftAuctionhouse.abi, wallet);

    await (await auctionhouse.resolveAuction(chain.erc721, tokenId)).wait();
}

module.exports = resolveAuction;

if (require.main === module) {
    const env = process.argv[2];
    if (env == null || (env != 'testnet' && env != 'local'))
        throw new Error('Need to specify tesntet or local as an argument to this script.');
    let temp;

    if (env == 'local') {
        temp = require(`../../../chain-config/local.json`);
    } else {
        temp = require(`@axelar-network/axelar-cgp-solidity/info/testnet.json`);
    }

    const chains = temp;
    const args = process.argv.slice(3);

    const chainName = args[0];
    const private_key = args[1];
    const tokenId = BigInt(args[2]);
    const chain = chains.find((chain) => chain.name == chainName);

    resolveAuction(chain, private_key, tokenId);
}
