'use strict';

const { HexString, CoinClient } = require('aptos');
const { getDefaultProvider, Contract } = require('ethers');
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
    await client.deploy('examples/aptos/token-linker/modules/build/token_linker', ['token_linker.mv'], '0xa1');
    console.log('Deployed token_linker for aptos.');
}

async function deploy(chain, wallet) {
    console.log(`Deploying Aptos Linked Token for ${chain.name}.`);
    const token = await deployContract(wallet, Token, ['Aptos Linked Token', 'ALT', 18]);
    chain.aptosLinkedToken = token.address;
    console.log(`Deployed Aptos Linked Token for ${chain.name} at ${chain.aptosLinkedToken}.`);

    console.log(`Deploying AptosTokenLinker for ${chain.name}.`);
    const contract = await deployContract(wallet, TokenLinker, [
        chain.gateway,
        chain.gasService,
        chain.aptosLinkedToken,
        aptosTokenLinkerAddress,
        ignoreDigits,
    ]);
    chain.aptosTokenLinker = contract.address;
    console.log(`Deployed AptosTokenLinker for ${chain.name} at ${chain.aptosTokenLinker}.`);
}

async function execute(chains, wallet, options) {
    const args = options.args || [];
    const client = new AptosNetwork(process.env.APTOS_URL);
    const coins = new CoinClient(client);

    for (const chain of chains) {
        const provider = getDefaultProvider(chain.rpc);
        chain.wallet = wallet.connect(provider);
        chain.token = new Contract(chain.aptosLinkedToken, Token.abi, chain.wallet);
        chain.contract = new Contract(chain.aptosTokenLinker, TokenLinker.abi, chain.wallet);
    }

    const evm = options.source;
    const amount1 = args[1] || BigInt(1e18);
    const amount2 = args[2] || BigInt(Math.floor(5e17 / 256 ** ignoreDigits));

    async function logBalances() {
        console.log(`Balance at ${evm.name} is ${(await evm.token.balanceOf(wallet.address)) / 1e18} ALT`);
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
        arguments: [evm.name, evm.aptosTokenLinker],
    });

    console.log('--- Initially ---');
    await logBalances();

    // Set the gasLimit to 3e5 (a safe overestimate) and get the gas price.
    const gasLimit = 3e5;
    const gasPrice = 1;

    console.log(`Minting and Approving ${Number(amount1) / 1e18} ALT`);

    await (await evm.token.mint(wallet.address, amount1)).wait();
    await (await evm.token.approve(evm.aptosTokenLinker, amount1)).wait();

    console.log('--- After Mint and Approve ---');
    await logBalances();

    console.log(`Sending token from ${evm.name} to aptos`);

    const tx = await evm.contract.sendToken(process.env.APTOS_ADDRESS, amount1, {
        value: BigInt(Math.floor(gasLimit * gasPrice)),
    });
    await tx.wait();

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    await sleep(3000);

    console.log('--- After Send to Aptos ---');
    await logBalances();

    const aptosTx = await client.submitTransactionAndWait(client.owner.address(), {
        function: `${aptosTokenLinkerAddress}::token_linker::send_token`,
        type_arguments: [],
        arguments: [new HexString(wallet.address).toUint8Array(), amount2, gasLimit * gasPrice],
    });

    await sleep(3000);

    console.log(`--- After Send to ${evm.name} ---`);
    await logBalances();
}

module.exports = {
    preDeploy,
    deploy,
    execute,
};
