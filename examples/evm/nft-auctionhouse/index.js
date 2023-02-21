'use strict';

const {
    getDefaultProvider,
    Contract,
    Wallet,
    utils: { keccak256, defaultAbiCoder },
} = require('ethers');
const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');
const mint = require('./mint');
const ownerOf = require('./ownerOf');
const bid = require('./bid');
const bidRemote = require('./bidRemote');
const auction = require('./auction');
const resolveAuction = require('./resolveAuction');

const Gateway = rootRequire(
    './artifacts/@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol/IAxelarGateway.json',
);
const ERC721 = rootRequire('./artifacts/examples/evm/nft-auctionhouse/ERC721Demo.sol/ERC721Demo.json');
const NftAuctionHouse = rootRequire('./artifacts/examples/evm/nft-auctionhouse/NftAuctionhouseRemote.sol/NftAuctionhouseRemote.json');
const IERC20 = rootRequire('./artifacts/@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol/IERC20.json');

async function deploy(chain, wallet) {
    console.log(`Deploying ERC721Demo for ${chain.name}.`);
    chain.provider = getDefaultProvider(chain.rpc);
    chain.wallet = wallet.connect(chain.provider);
    const erc721 = await deployContract(chain.wallet, ERC721, ['Test', 'TEST']);
    chain.erc721 = erc721.address;
    console.log(`Deployed ERC721Demo for ${chain.name} at ${chain.erc721}.`);
    console.log(`Deploying NftAuctionhouse for ${chain.name}.`);
    const gateway = new Contract(chain.gateway, Gateway.abi, wallet);
    const tokenAddress = await gateway.tokenAddresses('aUSDC');
    console.log(tokenAddress);
    chain.contract = await deployContract(wallet, NftAuctionHouse, [chain.gateway, chain.gasService, tokenAddress]);

    chain.auctionhouse = new Contract(chain.contract.address, NftAuctionHouse.abi, chain.wallet);
    chain.erc721contract = new Contract(chain.erc721, ERC721.abi, chain.wallet);
    console.log(`Deployed NftAuctionhouse for ${chain.name} at ${chain.contract.address}.`);

    chain.usdc = new Contract(tokenAddress, IERC20.abi, chain.wallet);
    chain.bidder = new Wallet(keccak256(defaultAbiCoder.encode(['string'], ['bidder-' + chain.name])), chain.provider);

    console.log(`Funding Bidder ${chain.bidder.address}`);
    await (
        await chain.wallet.sendTransaction({
            to: chain.bidder.address,
            value: BigInt(1e18),
        })
    ).wait();
    const deficit = 11e6 - (await chain.usdc.balanceOf(chain.bidder.address));
    if (deficit > 0) await (await chain.usdc.transfer(chain.bidder.address, deficit)).wait();
}

async function execute(chains, wallet, options) {
    const args = options.args || [];

    const firstUnminted = async (chain) => {
        for (let i = 0; true; i++) {
            try {
                await chain.erc721contract.ownerOf(i);
            } catch (e) {
                return i;
            }
        }
    };

    const destination = chains.find((chain) => chain.name === (args[1] || 'Avalanche'));
    const tokenId = args[2] || (await firstUnminted(destination));

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const auctioneer = new Wallet(keccak256(defaultAbiCoder.encode(['string'], ['auctioneer'])), destination.provider);

    console.log(`Funding Auctioneer ${auctioneer.address}`);
    const destinationWallet = wallet.connect(destination.provider);
    await destinationWallet
        .sendTransaction({
            to: auctioneer.address,
            value: BigInt(1e18),
        })
        .then((tx) => tx.wait());

    async function print() {
        console.log(`Auctioneer has ${await destination.usdc.balanceOf(auctioneer.address)}.`);

        for (const chain of chains) {
            const bidder = chain.bidder;
            console.log(`Bidder at ${chain.name} has ${await chain.usdc.balanceOf(bidder.address)}.`);
        }
    }

    await print();

    console.log(`Minting ${tokenId}`);
    await mint(destination, auctioneer.privateKey, tokenId);
    console.log(`Auctioning ${tokenId}`);
    await auction(destination, auctioneer.privateKey, tokenId, Math.floor(new Date().getTime() / 1000 + 10));

    for (const chain of chains) {
        console.log(`${chain.bidder.address} from ${chain.name} is bidding.`);
        const balance = await chain.usdc.balanceOf(chain.bidder.address);

        if (chain === destination) {
            await bid(chain, chain.bidder.privateKey, tokenId, 0);
        } else {
            await bidRemote(chain, destination, chain.bidder.privateKey, tokenId, 0);
        }

        const spent = balance - (await chain.usdc.balanceOf(chain.bidder.address));
        console.log(`Bid ${spent}.`);
    }

    while (await destination.auctionhouse.isAuctionRunning(destination.erc721contract.address, tokenId)) {
        console.log('waiting for auction end.');
        await sleep(1000);
        await (
            await destinationWallet.sendTransaction({
                to: wallet.address,
                value: 0,
            })
        ).wait();
    }

    await sleep(1000);
    await (
        await destinationWallet.sendTransaction({
            to: wallet.address,
            value: 0,
        })
    ).wait();

    await resolveAuction(destination, wallet.privateKey, tokenId);
    const winner = await ownerOf(destination, tokenId);
    console.log(`Bidder at ${chains.find((chain) => chain.bidder.address === winner).name} (${winner}) won the auction.`);
    await print();
}

module.exports = {
    deploy,
    execute,
    // postDeploy,
};
