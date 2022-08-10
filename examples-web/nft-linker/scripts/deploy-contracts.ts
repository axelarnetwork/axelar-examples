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

// deploy script
async function main() {
    /**
     * DEPLOY ON MOONBEAM
     */
    const moonbeamProvider = getDefaultProvider(moonbeamChain.rpc);
    const moonbeamConnectedWallet = wallet.connect(moonbeamProvider);
    const moonbeamERC721 = await deployContract(moonbeamConnectedWallet, ERC721, ['Test', 'TEST']);
    console.log(`ERC721Demo deployed on Avalanche ${moonbeamERC721.address}.`);
    moonbeamChain.erc721 = moonbeamERC721.address;
    const moonbeamSender = await deployAndInitContractConstant(
        moonbeamChain.constAddressDeployer,
        moonbeamConnectedWallet,
        MessageSenderContract,
        'nftLinkingSender',
        [],
        [moonbeamChain.name, moonbeamChain.gateway, moonbeamChain.gasReceiver]
    );
    console.log('MessageSender deployed on Moonbeam:', moonbeamSender.address);
    moonbeamChain.messageSender = moonbeamSender.address;
    const moonbeamReceiver = await deployAndInitContractConstant(
        moonbeamChain.constAddressDeployer,
        moonbeamConnectedWallet,
        MessageReceiverContract,
        'nftLinkingReceiver',
        [],
        [moonbeamChain.name, moonbeamChain.gateway]
    );
    console.log('MessageReceiver deployed on Moonbeam:', moonbeamReceiver.address);
    moonbeamChain.messageReceiver = moonbeamReceiver.address;

    /**
     * DEPLOY ON AVALANCHE
     */
    const avalancheProvider = getDefaultProvider(avalancheChain.rpc);
    const avalancheConnectedWallet = wallet.connect(avalancheProvider);
    const AvalancheERC721 = await deployContract(avalancheConnectedWallet, ERC721, ['Test', 'TEST']);
    console.log(`ERC721Demo deployed on Avalanche ${AvalancheERC721.address}.`);
    moonbeamChain.erc721 = AvalancheERC721.address;
    const avalancheSender = await deployAndInitContractConstant(
        avalancheChain.constAddressDeployer,
        avalancheConnectedWallet,
        MessageSenderContract,
        'nftLinkingSender',
        [],
        [avalancheChain.name, avalancheChain.gateway, avalancheChain.gasReceiver]
    );
    console.log('MessageSender deployed on Avalanche:', avalancheSender.address);
    avalancheChain.messageSender = avalancheSender.address;
    const avalancheReceiver = await deployAndInitContractConstant(
        avalancheChain.constAddressDeployer,
        avalancheConnectedWallet,
        MessageReceiverContract,
        'nftLinkingReceiver',
        [],
        [avalancheChain.name, avalancheChain.gateway]
    );
    console.log('MessageReceiver deployed on Avalanche:', avalancheReceiver.address);
    avalancheChain.messageReceiver = avalancheReceiver.address;

    // update chains
    const updatedChains = [moonbeamChain, avalancheChain];
    if (isTestnet) {
        await fs.writeFile('config/testnet.json', JSON.stringify(updatedChains, null, 2));
    } else {
        await fs.writeFile('config/local.json', JSON.stringify(updatedChains, null, 2));
    }
}

main();
