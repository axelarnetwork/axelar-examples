'use strict';

const { getDefaultProvider, Contract } = require('ethers');
const { configPath } = require('../../../config');

const ERC721 = rootRequire('./artifacts/examples/evm/nft-auctionhouse/ERC721Demo.sol/ERC721Demo.json');

async function ownerOf(chain, tokenId) {
    const provider = getDefaultProvider(chain.rpc);
    const contract = new Contract(chain.erc721, ERC721.abi, provider);
    return await contract.ownerOf(tokenId);
}

module.exports = ownerOf;

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
        } catch {
            temp = testnetInfo;
        }
    }
    const chains = temp;
    const args = process.argv.slice(3);

    const chainName = args[0];
    const tokenId = BigInt(args[1]);
    const chain = chains.find((chain) => chain.name === chainName);

    ownerOf(chain, tokenId).then((owner) => console.log(owner));
}
