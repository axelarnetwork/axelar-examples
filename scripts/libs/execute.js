'use strict';

require('dotenv').config();
require('./rootRequire');
const { Contract, getDefaultProvider } = require('ethers');
const { calculateBridgeFee, getDepositAddress, sanitizeEventArgs } = require('./utils.js');

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

    // Get source and destination chains.
    const source = getSourceChain(chains, args);
    const destination = getDestChain(chains, args);

    // Listen for GMP events.
    listenForGMPEvent(env, source);

    // Execute the example script.
    await example.execute(chains, wallet, {
        calculateBridgeFee,
        getDepositAddress: (source, destination, destinationAddress, symbol) =>
            getDepositAddress(env, source, destination, destinationAddress, symbol),
        source,
        destination,
        args,
    });

    process.exit(0);
}

/**
 * Get the source chain. If no source chain is provided, use Avalanche.
 * @param {*} chains - The chain objects to execute on.
 * @param {*} args - The arguments to pass to the example script.
 * @returns The source chain.
 */
function getSourceChain(chains, args) {
    return chains.find((chain) => chain.name === (args[0] || 'Avalanche'));
}

/**
 * Get the destination chain. If no destination chain is provided, use Fantom.
 * @param {*} chains - The chain objects to execute on.
 * @param {*} args - The arguments to pass to the example script.
 * @returns The destination chain.
 */
function getDestChain(chains, args) {
    return chains.find((chain) => chain.name === (args[1] || 'Fantom'));
}

/**
 * Deserialize the contracts in the chain object.
 * @param {*} chain - The chain object.
 * @param {*} wallet - The wallet to use for execution.
 * @returns The chain object with the contracts deserialized.
 */
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

    return chain;
}

/**
 * Listen for GMP events.
 * If a GMP event is detected, log the transaction hash. If the environment is testnet, log the link to the transaction on Axelarscan.
 * @param {*} env - The environment to execute on.
 * @param {*} source - The source chain.
 * @param {*} wallet - The wallet to use for execution.
 */
function listenForGMPEvent(env, source) {
    const gateway = source.gateway;
    const callContractFilter = gateway.filters.ContractCall(source.contract.address);
    const callContractWithTokenFilter = gateway.filters.ContractCallWithToken(source.contract.address);

    const eventHandler = (...args) => {
        const event = args.pop();
        const sanitizedArgs = sanitizeEventArgs(event);

        console.log(`\n--- ${event.event} event detected ---`);
        console.log(sanitizedArgs, '\n');

        if (env === 'testnet') {
            console.log('Track the status on https://testnet.axelarscan.io/gmp/' + event.transactionHash + '\n');
        }
    };

    gateway.once(callContractFilter, eventHandler);
    gateway.once(callContractWithTokenFilter, eventHandler);
}

module.exports = {
    execute,
};
