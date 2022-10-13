'use strict';

const { deployUpgradable } = require('@axelar-network/axelar-gmp-sdk-solidity');
const { forkAndExport, forkNetwork, mainnetInfo } = require('@axelar-network/axelar-local-dev');

const ExampleProxy = require('../../artifacts/examples/Proxy.sol/ExampleProxy.json');
const LendingSatellite = require('../../artifacts/examples/cross-chain-lending/LendingSatellite.sol/LendingSatellite.json');
const Comptroller = require('../../artifacts/examples/cross-chain-lending/interfaces/Comptroller.sol/Comptroller.json');
const { Contract, providers, ethers } = require('ethers');

const ADDRESS_COMPOUND_ADMIN = '0x6d903f6003cca6255D85CcA4D3B5E5146dC33925';
const ADDRESS_WBTC_TOKEN = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';
const ADDRESS_CWBTC_TOKEN = '0xC11b1268C1A384e55C48c2391d8d480264A3A7F4';
const ADDRESS_WBTC_MINTER = '0xCA06411bd7a7296d7dbdd0050DFc846E95fEBEB7';
const ADDRESS_SUSHI_TOKEN = '0x6B3595068778DD592e39A122f4f5a5cF09C90fE2';
const ADDRESS_CSUSHI_TOKEN = '0x4B0181102A0112A2ef11AbEE5563bb4a3176c9d7';
const ADDRESS_SUSHI_MINTER = '0xc2EdaD668740f1aA35E4D8f227fB8E17dcA888Cd';

async function test(chains, wallet, options) {
    const baseChainInfo = mainnetInfo.find((chain) => chain.name === 'Ethereum');
    const baseChain = await forkNetwork(baseChainInfo, {});

    const ganacheOptions = {
        database: { dbPath: options.dbPath },
        wallet: {
            accounts: baseChain.ganacheProvider.getOptions().accounts,
            unlockedAccounts: [ADDRESS_COMPOUND_ADMIN, ADDRESS_WBTC_MINTER, ADDRESS_SUSHI_MINTER],
        },
        chain: {
            chainId: baseChainInfo.chainId,
            networkId: baseChainInfo.chainId,
            vmErrorsOnRPCResponse: true,
        },
        fork: {
            url: baseChainInfo.rpc,
        },
        logging: { quiet: true },
    };

    baseChain.ganacheProvider = require('ganache').provider(ganacheOptions);
    baseChain.provider = new providers.Web3Provider(baseChain.ganacheProvider);

    await baseChain.userWallets[0].sendTransaction({
        to: ADDRESS_WBTC_MINTER,
        value: ethers.utils.parseEther('1'),
    });
    await baseChain.userWallets[0].sendTransaction({
        to: ADDRESS_SUSHI_MINTER,
        value: ethers.utils.parseEther('1'),
    });

    baseChain.wbtc = await baseChain.deployToken('Wrapped BTC', 'WBTC', 8, BigInt(1e70), ADDRESS_WBTC_TOKEN);
    baseChain.sushi = await baseChain.deployToken('SushiToken', 'SUSHI', 18, BigInt(1e70), ADDRESS_SUSHI_TOKEN);

    const wbtcMinter = baseChain.provider.getSigner(ADDRESS_WBTC_MINTER);
    const sushiMinter = baseChain.provider.getSigner(ADDRESS_SUSHI_MINTER);

    await baseChain.wbtc.connect(wbtcMinter).mint(baseChain.gateway.address, BigInt(1e16));
    await baseChain.sushi.connect(sushiMinter).mint(baseChain.gateway.address, BigInt(1e28));

    // const compoundAdmin = baseNetwork.provider.getSigner(ADDRESS_COMPOUND_ADMIN);
    // baseChain.compoundController = new Contract('0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B', Comptroller.abi, compoundAdmin);

    // console.log(`Deploying CompoundInterface for ${baseChain.name}.`);
    // baseChain.compoundInterface = await deployUpgradable(
    //     baseChain.constAddressDeployer,
    //     wallet,
    //     CompoundInterface,
    //     ExampleProxy,
    //     [baseChain.gateway],
    //     [],
    //     '0x',
    //     'compoundInterface',
    // );
    // console.log(`Deployed CompoundInterface for ${baseChain.name} at ${baseChain.compoundInterface.address}`);

    // for (const chain in chains) {
    //     console.log(`Deploying LendingSatellite for ${chain.name}.`);
    //     chain.satellite = await deployUpgradable(
    //         chain.constAddressDeployer,
    //         wallet,
    //         LendingSatellite,
    //         ExampleProxy,
    //         [chain.gateway],
    //         [],
    //         '0x',
    //         'satellite',
    //     );
    //     console.log(`Deployed LendingSatellite for ${chain.name} at ${chain.satellite.address}`);
    // }
}

module.exports = {
    test,
};
