'use strict';

const { HexString, CoinClient } = require('aptos');
const {
    utils: { deployContract },
    AptosNetwork,
} = require('@axelar-network/axelar-local-dev');

const TokenLinker = rootRequire('./artifacts/examples/aptos/token-linker/contracts/AptosTokenLinker.sol/AptosTokenLinker.json');
const Token = require('@axelar-network/axelar-gmp-sdk-solidity/artifacts/contracts/test/ERC20MintableBurnable.sol/ERC20MintableBurnable.json');

const aptosTokenLinkerAddress = process.env.APTOS_TOKEN_LINKER_ADDRESS;
const ignoreDigits = 5;

async function preDeploy() {
    console.log('Deploying token_linker for aptos.');
    const client = new AptosNetwork(process.env.APTOS_URL);
    await client.deploy('examples/aptos/token-linker/modules/build/token_linker', ['token_linker.mv'], '0xa2');
    console.log('Deployed token_linker for aptos.');
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
    const amount1 = args[1] || BigInt(1e18);
    const amount2 = args[2] || BigInt(Math.floor(5e17 / 256 ** ignoreDigits));

    async function logBalances() {
        console.log(`Balance at ${evmChain.name} is ${(await evmChain.token.balanceOf(wallet.address)) / 1e18} ALT`);
        const balance = await coins.checkBalance(client.owner, { coinType: `${aptosTokenLinkerAddress}::token_linker::Token` });
        console.log(`Balance at aptos is ${(Number(balance) * 256 ** ignoreDigits) / 1e18} ALT`);
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

    console.log(`Minting and Approving ${Number(amount1) / 1e18} ALT`);

    await (await evmChain.token.mint(wallet.address, amount1)).wait();
    await (await evmChain.token.approve(evmChain.contract.address, amount1)).wait();

    console.log('--- After Mint and Approve ---');
    await logBalances();

    console.log(`Sending token from ${evmChain.name} to aptos`);

    const tx = await evmChain.contract.sendToken(process.env.APTOS_ADDRESS, amount1, {
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
        arguments: [new HexString(wallet.address).toUint8Array(), amount2, gasLimit * gasPrice],
    });

    await sleep(3000);

    console.log(`--- After Send to ${evmChain.name} ---`);
    await logBalances();
}

module.exports = {
    preDeploy,
    deploy,
    execute,
};
