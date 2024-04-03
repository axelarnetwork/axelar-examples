const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');
const CallContractWithValuedExpress = rootRequire(
    './artifacts/examples/evm/call-contract-with-valued-express/CallContractWithValuedExpress.sol/CallContractWithValuedExpress.json',
);
const MockERC20 = rootRequire('./artifacts/examples/evm/call-contract-with-valued-express/mocks/MockERC20.sol/MockERC20.json');
async function deploy(chain, wallet) {
    console.log(`Deploying Call Contract Valued Express for ${chain.name}.`);
    chain.callContractWithValuedExpress = await deployContract(wallet, CallContractWithValuedExpress, [chain.gateway, chain.gasService]);
    chain.mockToken = await deployContract(wallet, MockERC20);
    chain.wallet = wallet;
    console.log(`Deployed CallContractWithValuedExpress for ${chain.name} at ${chain.callContractWithValuedExpress.address}.`);
}

async function execute(chains, wallet, options) {
    const args = options.args || [];
    const { source, destination, calculateBridgeExpressFee } = options;

    // Get the accounts to send to.
    const accounts = args.slice(3);

    // Calculate the express fee for the bridge.
    const expressFee = await calculateBridgeExpressFee(source, destination);

    // Get the balance of the first account.
    const initialBalance = await destination.mockToken.balanceOf(accounts[0]);

    // Get the amount to send.
    const amount = Math.floor(parseFloat(args[2])) * 1e6 || 10e6;

    async function logAccountBalances() {
        for (const account of accounts) {
            console.log(`${account} has ${(await destination.mockToken.balanceOf(account)) / 1e6} tokens on ${destination.name}`);
        }
    }

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    console.log('--- Initially ---');

    // Log the balances of the accounts.
    await logAccountBalances();

    // Send tokens to the distribution contract.
    const sendTx = await source.callContractWithValuedExpress.sendValuedMessage(
        destination.name,
        destination.callContractWithValuedExpress.address,
        destination.mockToken.address,
        amount,
        accounts[0],
        {
            value: expressFee,
        },
    );

    console.log('Sent valued msg to destination contract:', sendTx.hash);

    // Wait for the distribution to complete by checking the balance of the first account.
    while ((await destination.mockToken.balanceOf(accounts[0])).eq(initialBalance)) {
        await sleep(1000);
    }

    console.log('--- After ---');
    // Log the balances of the accounts.
    await logAccountBalances();
}

module.exports = {
    deploy,
    execute,
};
