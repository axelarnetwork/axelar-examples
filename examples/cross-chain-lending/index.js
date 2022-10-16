'use strict';

const {
    forkNetwork,
    createNetwork,
    mainnetInfo,
    utils: { defaultAccounts, deployContract },
} = require('@axelar-network/axelar-local-dev');

const LendingSatellite = require('../../artifacts/examples/cross-chain-lending/LendingSatellite.sol/LendingSatellite.json');
const CompoundInterface = require('../../artifacts/examples/cross-chain-lending/CompoundInterface.sol/CompoundInterface.json');
const Comptroller = require('../../artifacts/examples/cross-chain-lending/interfaces/Comptroller.sol/Comptroller.json');
const {
    Contract,
    utils: { defaultAbiCoder },
} = require('ethers');

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
const ADDRESS_COMPOUND_ADMIN = '0x6d903f6003cca6255D85CcA4D3B5E5146dC33925';
const ADDRESS_WBTC_TOKEN = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';
const ADDRESS_CWBTC_TOKEN = '0xC11b1268C1A384e55C48c2391d8d480264A3A7F4';
const ADDRESS_WBTC_MINTER = '0xCA06411bd7a7296d7dbdd0050DFc846E95fEBEB7';
const ADDRESS_SUSHI_TOKEN = '0x6B3595068778DD592e39A122f4f5a5cF09C90fE2';
const ADDRESS_CSUSHI_TOKEN = '0x4B0181102A0112A2ef11AbEE5563bb4a3176c9d7';
const ADDRESS_SUSHI_MINTER = '0xc2EdaD668740f1aA35E4D8f227fB8E17dcA888Cd';

const OLD_ADMIN_ADDRESSES = [
    '0x3f5876a2b06E54949aB106651Ab6694d0289b2b4',
    '0x9256Fd872118ed3a97754B0fB42c15015d17E0CC',
    '0x5C8EF9ca7b43c93Ac4a146BeF77FAFbc7D3e69B7',
    '0x1486157d505C7F7E546aD00E3E2Eee25BF665C9b',
];

const FUNDING_AMOUNT = BigInt(1e20);
const SUPPLY_AMOUNT = BigInt(1e16);
const BORROW_AMOUNT = BigInt(1e8);

async function deployTokens(chain, axlWrapped) {
    chain.wbtc = await chain.deployToken('Wrapped BTC', 'WBTC', 8, BigInt(1e70), axlWrapped ? ADDRESS_ZERO : ADDRESS_WBTC_TOKEN);
    chain.sushi = await chain.deployToken('SushiToken', 'SUSHI', 18, BigInt(1e70), axlWrapped ? ADDRESS_ZERO : ADDRESS_SUSHI_TOKEN);
}

async function setupBaseChain() {
    const networkOptions = {
        ganacheOptions: {
            wallet: {
                accounts: defaultAccounts(20, ''),
                unlockedAccounts: OLD_ADMIN_ADDRESSES.concat([ADDRESS_COMPOUND_ADMIN, ADDRESS_SUSHI_MINTER, ADDRESS_WBTC_MINTER]),
            },
        },
    };

    const baseChainInfo = mainnetInfo.find((chain) => chain.name === 'Ethereum');
    const baseChain = await forkNetwork(baseChainInfo, networkOptions);

    baseChain.wallet = baseChain.userWallets[0];
    baseChain.forecaller = baseChain.userWallets[1];

    await deployTokens(baseChain, false);

    await baseChain.provider.send('evm_setAccountBalance', [ADDRESS_COMPOUND_ADMIN, FUNDING_AMOUNT]);
    await baseChain.provider.send('evm_setAccountBalance', [ADDRESS_WBTC_MINTER, FUNDING_AMOUNT]);
    await baseChain.provider.send('evm_setAccountBalance', [ADDRESS_SUSHI_MINTER, FUNDING_AMOUNT]);

    const wbtcMinter = baseChain.provider.getSigner(ADDRESS_WBTC_MINTER);
    const sushiMinter = baseChain.provider.getSigner(ADDRESS_SUSHI_MINTER);

    await baseChain.wbtc.connect(wbtcMinter).mint(baseChain.gateway.address, FUNDING_AMOUNT);
    await baseChain.sushi.connect(sushiMinter).mint(baseChain.gateway.address, FUNDING_AMOUNT);
    await baseChain.wbtc.connect(wbtcMinter).mint(baseChain.forecaller.address, FUNDING_AMOUNT);

    return baseChain;
}

async function setupSatelliteChain() {
    const satelliteChain = await createNetwork({
        name: 'Avalanche',
        seed: '',
        ganacheOptions: {},
    });

    satelliteChain.wallet = satelliteChain.userWallets[0];
    await deployTokens(satelliteChain, true);

    await satelliteChain.giveToken(satelliteChain.wallet.address, 'WBTC', FUNDING_AMOUNT);
    await satelliteChain.giveToken(satelliteChain.wallet.address, 'SUSHI', FUNDING_AMOUNT);

    return satelliteChain;
}

async function configureCompoundProtocol(baseChain) {
    const compoundAdmin = baseChain.provider.getSigner(ADDRESS_COMPOUND_ADMIN);
    baseChain.compoundController = new Contract('0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B', Comptroller.abi, compoundAdmin);
    await baseChain.compoundController._setMintPaused(ADDRESS_CWBTC_TOKEN, false);
    await baseChain.compoundController._setMintPaused(ADDRESS_CSUSHI_TOKEN, false);
}

async function test(chains, wallet, options) {
    const baseChain = await setupBaseChain();
    const satelliteChain = await setupSatelliteChain();

    await configureCompoundProtocol(baseChain);

    console.log(`Deploying CompoundInterface for ${baseChain.name}.`);
    baseChain.compoundInterface = await deployContract(baseChain.userWallets[0], CompoundInterface, [
        baseChain.gateway.address,
        ['WBTC', 'SUSHI'],
        [ADDRESS_CWBTC_TOKEN, ADDRESS_CSUSHI_TOKEN],
    ]);
    console.log(`Deployed CompoundInterface for ${baseChain.name} at ${baseChain.compoundInterface.address}`);

    console.log(`Deploying LendingSatellite for ${satelliteChain.name}.`);
    satelliteChain.satellite = await deployContract(satelliteChain.wallet, LendingSatellite, [
        satelliteChain.gateway.address,
        'Ethereum',
        baseChain.compoundInterface.address,
    ]);
    console.log(`Deployed LendingSatellite for ${satelliteChain.name} at ${satelliteChain.satellite.address}`);

    console.log('Initial user WBCT balance', (await satelliteChain.wbtc.balanceOf(satelliteChain.wallet.address)).toString());
    console.log('Initial user SUSHI balance', (await satelliteChain.sushi.balanceOf(satelliteChain.wallet.address)).toString());

    await satelliteChain.wbtc.connect(satelliteChain.wallet).approve(satelliteChain.satellite.address, FUNDING_AMOUNT);
    await satelliteChain.sushi.connect(satelliteChain.wallet).approve(satelliteChain.satellite.address, FUNDING_AMOUNT);

    await satelliteChain.satellite.supplyAndBorrow('WBTC', SUPPLY_AMOUNT, 'SUSHI', BORROW_AMOUNT);

    const params = defaultAbiCoder.encode(['string', 'uint256', 'string'], ['SUSHI', BORROW_AMOUNT, satelliteChain.wallet.address]);
    const payload = defaultAbiCoder.encode(['string', 'bytes'], ['supplyAndBorrow', params]);

    await baseChain.wbtc.connect(baseChain.forecaller).approve(baseChain.compoundInterface.address, SUPPLY_AMOUNT);
    await baseChain.compoundInterface
        .connect(baseChain.forecaller)
        .forecallWithToken('Avalanche', satelliteChain.satellite.address, payload, 'WBTC', SUPPLY_AMOUNT);
}

module.exports = {
    test,
};
