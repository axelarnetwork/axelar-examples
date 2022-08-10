import fs from 'fs/promises';
import { getDefaultProvider } from 'ethers';
import { isTestnet, wallet } from '../config/constants';

const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');
const { deployAndInitContractConstant } = require('@axelar-network/axelar-utils-solidity');

// load contracts
const MessageSenderContract = require('../artifacts/contracts/NFTLinkingSender.sol/NFTLinkingSender.json');
const MessageReceiverContract = require('../artifacts/contracts/NFTLinkingReceiver.sol/NFTLinkingReceiver.json');
const ERC721 = require('../artifacts/contracts/ERC721demo.sol/ERC721Demo.json');

let chains = isTestnet ? require('../config/testnet.json') : require('../config/local.json');

// get chains
const moonbeamChain = chains.find((chain: any) => chain.name === 'Moonbeam');
const avalancheChain = chains.find((chain: any) => chain.name === 'Avalanche');

const nftTokenId = 0;

// deploy script
async function deployNFTContracts(chain: any) {
    console.log(`\n*****${chain.name.toUpperCase()}*****`);
    const provider = getDefaultProvider(chain.rpc);
    const walletConnectedToProvider = wallet.connect(provider);

    // deploy/mint an NFT to selected chain
    const erc721 = await deployContract(walletConnectedToProvider, ERC721, ['Test', 'TEST']);
    chain.erc721 = erc721.address;
    console.log(`ERC721Demo deployed on ${chain.name} ${erc721.address}.`);

    await (await erc721.mint(nftTokenId)).wait(1);
    console.log(`Minted token ${nftTokenId} for ${chain.name}`);

    // deploy Axelar sender to selected chain
    const sender = await deployAndInitContractConstant(
        chain.constAddressDeployer,
        walletConnectedToProvider,
        MessageSenderContract,
        'nftLinkingSender',
        [],
        [chain.name, chain.gateway, chain.gasReceiver]
    );
    console.log(`MessageSender deployed on ${chain.name}: ${sender.address}`);
    chain.messageSender = sender.address;

    const receiver = await deployAndInitContractConstant(
        chain.constAddressDeployer,
        walletConnectedToProvider,
        MessageReceiverContract,
        'nftLinkingReceiver',
        [],
        [chain.name, chain.gateway]
    );
    console.log(`MessageReceiver deployed on ${chain.name}: ${receiver.address}\n`);
    chain.messageReceiver = receiver.address;

}

async function main() {
    await deployNFTContracts(moonbeamChain);
    await deployNFTContracts(avalancheChain);

    // update chains
    const updatedChains = [moonbeamChain, avalancheChain];
    if (isTestnet) {
        await fs.writeFile('config/testnet.json', JSON.stringify(updatedChains, null, 2));
    } else {
        await fs.writeFile('config/local.json', JSON.stringify(updatedChains, null, 2));
    }
}

main();
