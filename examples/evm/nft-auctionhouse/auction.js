'use strict';

const { getDefaultProvider, Contract, Wallet } = require('ethers');
const { configPath } = require('../../../config');
const ERC721 = rootRequire('./artifacts/examples/evm/nft-auctionhouse/ERC721Demo.sol/ERC721Demo.json');
const NftAuctionhouse = rootRequire('./artifacts/examples/evm/nft-auctionhouse/NftAuctionhouseRemote.sol/NftAuctionhouseRemote.json');

async function auction(chain, privateKey, tokenId, deadline, min) {
    deadline = deadline || Math.floor(new Date().getTime() / 1000 + 60);
    min = min || 0;
    const provider = getDefaultProvider(chain.rpc);
    const wallet = new Wallet(privateKey, provider);
    const erc721 = new Contract(chain.erc721, ERC721.abi, wallet);
    const auctionhouse = new Contract(chain.contract.address, NftAuctionhouse.abi, wallet);

    await (await erc721.approve(auctionhouse.address, tokenId)).wait();

    await (await auctionhouse.auction(erc721.address, tokenId, min, deadline)).wait();
}

module.exports = auction;

if (require.main === module) {
    const env = process.argv[2];
    if (env == null || (env !== 'testnet' && env !== 'local'))
        throw new Error('Need to specify tesntet or local as an argument to this script.');
    let temp;

    if (env === 'local') {
        temp = require(configPath.localEvmChains);
    } else {
        try {
            temp = require(`@axelar-network/axelar-chains-config`).getChainArray('testnet');
        } catch (e) {
            temp = testnetInfo;
        }
    }

    const chains = temp;
    const args = process.argv.slice(3);

    const chainName = args[0];
    const privateKey = args[1];
    const tokenId = BigInt(args[2]);

    const chain = chains.find((chain) => chain.name == chainName);
    const deadline = BigInt(args[3] || Math.floor(new Date().getTime() / 1000 + 60));
    const min = BigInt(args[4] || 0);

    auction(chain, privateKey, tokenId, deadline, min);
}
