'use strict';

const { HexString, CoinClient } = require('aptos');
const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');
const { AptosNetwork } = require('@axelar-network/axelar-local-dev-aptos');
const TokenLinker = rootRequire('./artifacts/examples/aptos/token-linker/contracts/AptosTokenLinker.sol/AptosTokenLinker.json');
const Token = rootRequire('./artifacts/examples/aptos/token-linker/contracts/ERC20MintableBurnable.sol/ERC20MintableBurnable.json');
const { ethers } = require('ethers');

const aptosTokenLinkerAddress = process.env.APTOS_TOKEN_LINKER_ADDRESS;
const ignoreDigits = 5;

async function isDeployedTokenLinker(client) {
    const resources = await client.getAccountResources(aptosTokenLinkerAddress).catch((e) => undefined);
    if (!resources) return false;
    return resources.find((resource) => resource.type === `${aptosTokenLinkerAddress}::token_linker::State`);
}

async function deployOnAltChain() {
    const client = new AptosNetwork(process.env.APTOS_URL);
    const isDeployed = await isDeployedTokenLinker(client);

    if (!isDeployed) {
        console.log('Deploying token_linker for Aptos.');
        const tx = await client.deploy('examples/aptos/token-linker/modules/build/token_linker', ['token_linker.mv'], '0xa1');
        console.log('Deployed token_linker for Aptos:', tx.hash);
    }
}

async function deploy(evmChain, wallet) {
    console.log(`Deploying AptosLinkedToken for ${evmChain.name}.`);
    evmChain.token = await deployContract(wallet, Token, ['AptosLinkedToken', 'ALT', 18]);
    console.log(`Deployed AptosLinkedToken for ${evmChain.name} at ${evmChain.token.address}.`);

    console.log(`Deploying AptosTokenLinker for ${evmChain.name}.`);
    evmChain.contract = await deployContract(wallet, TokenLinker, [
        evmChain.gateway,
        evmChain.gasService,
        evmChain.token.address,
        aptosTokenLinkerAddress,
        ignoreDigits,
    ]);
    console.log(`Deployed AptosTokenLinker for ${evmChain.name} at ${evmChain.contract.address}.`);
}

async function execute(evmChain, wallet, options) {
    const args = options.args || [];
    const client = new AptosNetwork(process.env.APTOS_URL);
    const coins = new CoinClient(client);
    const amountEvmToAptos = args[1] || ethers.utils.parseEther('1');
    const amountAptosToEvm =
        args[2] ||
        ethers.utils
            .parseEther('0.5')
            .div(256 ** ignoreDigits)
            .toString();

    async function logBalances() {
        const evmBalance = await evmChain.token.balanceOf(wallet.address).then((balance) => ethers.utils.formatEther(balance));
        console.log(`Balance at ${evmChain.name} is ${evmBalance} ALT`);
        const aptosBalance = await coins.checkBalance(client.owner, {
            coinType: `${aptosTokenLinkerAddress}::token_linker::Token`,
        });
        console.log(`Balance at aptos is ${(Number(aptosBalance) * 256 ** ignoreDigits) / 1e18} ALT`);
    }

    console.log('Initializing token storage.');

    await client.submitTransactionAndWait(client.owner.address(), {
        function: `${aptosTokenLinkerAddress}::token_linker::register`,
        type_arguments: [],
        arguments: [],
    });

    console.log('Initializing token linker destination.');
    await client.submitTransactionAndWait(client.owner.address(), {
        function: `${aptosTokenLinkerAddress}::token_linker::set_params`,
        type_arguments: [],
        arguments: [evmChain.name, evmChain.contract.address],
    });

    console.log('--- Initially ---');
    await logBalances();

    // Currently, our SDK can't calculate bridge fee for Aptos, so we just use a fixed value.
    const gasLimit = 3e5;
    const gasPrice = 1;

    console.log(`Minting and Approving ${ethers.utils.formatEther(amountEvmToAptos)} ALT`);

    await (await evmChain.token.mint(wallet.address, amountEvmToAptos)).wait();
    await (await evmChain.token.approve(evmChain.contract.address, amountEvmToAptos)).wait();

    console.log('--- After Mint and Approve ---');
    await logBalances();

    console.log(`Sending token from ${evmChain.name} to aptos`);

    const tx = await evmChain.contract.sendToken(process.env.APTOS_ADDRESS, amountEvmToAptos, {
        value: BigInt(Math.floor(gasLimit * gasPrice)),
    });
    await tx.wait();

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    await sleep(3000);

    console.log('--- After Send to Aptos ---');
    await logBalances();

    await client.submitTransactionAndWait(client.owner.address(), {
        function: `${aptosTokenLinkerAddress}::token_linker::send_token`,
        type_arguments: [],
        arguments: [new HexString(wallet.address).toUint8Array(), amountAptosToEvm, gasLimit * gasPrice],
    });

    await sleep(3000);

    console.log(`--- After Send to ${evmChain.name} ---`);
    await logBalances();
}

module.exports = {
    deployOnAltChain,
    deploy,
    execute,
};
