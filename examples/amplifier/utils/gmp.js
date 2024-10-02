const { providers, Wallet, ethers } = require('ethers');
const AmplifierGMPTest = require('../../../artifacts/examples/amplifier/contracts/AmplifierGMPTest.sol/AmplifierGMPTest.json');
const { getChainConfig } = require('../config/config.js');
const { processContractCallEvent } = require('../gmp-api/contract-call-event.js');
const { sleep } = require('./sleep.js');

const gmp = async ({ sourceChain, destinationChain, message, destinationContractAddress, srcContractAddress }) => {
    const provider = new providers.JsonRpcProvider(getChainConfig(sourceChain).rpc);
    const wallet = new Wallet(process.env.EVM_PRIVATE_KEY, provider);
    const srcContract = new ethers.Contract(srcContractAddress, AmplifierGMPTest.abi, wallet);

    try {
        const tx = await srcContract.setRemoteValue(destinationChain, destinationContractAddress, message);
        const transactionReceipt = await tx.wait();

        await sleep(10000); // allow for gmp event to propagate before triggering indexing

        processContractCallEvent(sourceChain, transactionReceipt.transactionHash, true);
    } catch (error) {
        throw new Error(`Error calling contract: ${error}`);
    }
};

module.exports = {
    gmp,
};
