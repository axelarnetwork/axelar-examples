'use strict';

require('dotenv').config();
require('./rootRequire');
const { Contract, getDefaultProvider } = require('ethers');
const { getGasPrice, getDepositAddress } = require('./utils.js');

const AxelarGatewayContract = rootRequire(
    'artifacts/@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol/IAxelarGateway.json',
);
const AxelarGasServiceContract = rootRequire(
    'artifacts/@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol/IAxelarGasService.json',
);
const IERC20 = rootRequire('artifacts/@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol/IERC20.json');

/**
 * Execute an example script. The example script must have an `execute` function.
 * @param {*} env - The environment to execute on.
 * @param {*} chains - The chain objects to execute on.
 * @param {*} args - The arguments to pass to the example script.
 * @param {*} wallet - The wallet to use for execution.
 * @param {*} example - The example to execute.
 */
async function execute(env, chains, args, wallet, example) {
    for (const chain of chains) {
        chain.provider = getDefaultProvider(chain.rpc);
        const connectedWallet = wallet.connect(chain.provider);

        // Initialize contracts to chain object.
        deserializeContract(chain, connectedWallet);

        // Recover axelar contracts to chain object.
        chain.gateway = new Contract(chain.gateway, AxelarGatewayContract.abi, connectedWallet);
        chain.gasService = new Contract(chain.gasService, AxelarGasServiceContract.abi, connectedWallet);
        const tokenAddress = await chain.gateway.tokenAddresses('aUSDC');
        chain.usdc = new Contract(tokenAddress, IERC20.abi, connectedWallet);
    }

    await example.execute(chains, wallet, {
        getGasPrice: (source, destination, tokenAddress) => getGasPrice(env, source, destination, tokenAddress),
        getDepositAddress: (source, destination, destinationAddress, symbol) =>
            getDepositAddress(env, source, destination, destinationAddress, symbol),
        args,
    });
}

function deserializeContract(chain, wallet) {
    // Loop through every keys in the chain object.
    for (const key of Object.keys(chain)) {
        // If the object has an abi, it is a contract.

        if (chain[key].abi) {
            // Get the contract object.
            const contract = chain[key];

            // Deserialize the contract. Assign the contract to the chain object.
            chain[key] = new Contract(contract.address, contract.abi, wallet);
        }
    }
}

module.exports = {
    execute,
};
