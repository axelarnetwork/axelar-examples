require('dotenv').config();
const { createAndExport, createAptosNetwork } = require('@axelar-network/axelar-local-dev');
const { Wallet } = require('ethers');

async function createLocal(toFund = []) {
    try {
        await createAptosNetwork();
        console.log('Initialized aptos.');
    } catch {
        console.log('Could not initialize aptos, rerun this after starting an aptos node for proper support.');
    }

    async function callback(chain, info) {
        await chain.deployToken('Axelar Wrapped aUSDC', 'aUSDC', 6, BigInt(1e70));

        for (const address of toFund) {
            await chain.giveToken(address, 'aUSDC', BigInt(1e18));
        }
    }

    await createAndExport({
        chainOutputPath: './info/local.json',
        accountsToFund: toFund,
        callback,
    });
}

module.exports = {
    createLocal,
};

if (require.main === module) {
    const deployer_key = process.env.EVM_PRIVATE_KEY;
    const deployer_address = new Wallet(deployer_key).address;
    const toFund = [deployer_address];

    for (let j = 2; j < process.argv.length; j++) {
        toFund.push(process.argv[j]);
    }

    createLocal(toFund);
}
