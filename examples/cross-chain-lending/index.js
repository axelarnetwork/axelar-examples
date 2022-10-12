'use strict';

const { deployUpgradable } = require('@axelar-network/axelar-gmp-sdk-solidity');
const { forkAndExport } = require('@axelar-network/axelar-local-dev');

const ExampleProxy = require('../../artifacts/examples/Proxy.sol/ExampleProxy.json');
const LendingSatellite = require('../../artifacts/examples/cross-chain-lending/LendingSatellite.sol/LendingSatellite.json');
const Comptroller = require('../../artifacts/examples/cross-chain-lending/interfaces/Comptroller.sol/Comptroller.json');
const { Contract } = require('ethers');

async function test(chains, wallet, options) {
    await forkAndExport({
        chainOutputPath: './info/local.json',
        accountsToFund: [wallet.address],
        chains: ['Ethereum'],
        networkOptions: {
            ganacheOptions: {
                unlock: '0x6d903f6003cca6255D85CcA4D3B5E5146dC33925',
            },
        },
    });

    const baseChain = chains.find((chain) => chain.name === 'Ethereum');

    baseChain.compoundController = new Contract('0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B', Comptroller.abi, baseChain.provider);

    console.log('1. PauseGuardian', await baseChain.compoundController.pauseGuardian());
    await baseChain.compoundController._setPauseGuardian('0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B');
    console.log('2. PauseGuardian', await baseChain.compoundController.pauseGuardian());

    console.log(`Deploying CompoundInterface for ${baseChain.name}.`);
    baseChain.compoundInterface = await deployUpgradable(
        baseChain.constAddressDeployer,
        wallet,
        LendingSatellite,
        ExampleProxy,
        [baseChain.gateway],
        [],
        '0x',
        'satellite',
    );
    console.log(`Deployed CompoundInterface for ${baseChain.name} at ${baseChain.compoundInterface.address}`);

    for (const chain in chains) {
        console.log(`Deploying LendingSatellite for ${chain.name}.`);
        chain.satellite = await deployUpgradable(
            chain.constAddressDeployer,
            wallet,
            LendingSatellite,
            ExampleProxy,
            [chain.gateway],
            [],
            '0x',
            'satellite',
        );
        console.log(`Deployed LendingSatellite for ${chain.name} at ${chain.satellite.address}`);
    }
}

module.exports = {
    test,
};
