const axios = require('axios');
const { ethers } = require('ethers');
const { getConfig, getChainConfig } = require('../config.js');

const { GMP_API_URL } = getConfig();

// ABI for the ContractCall event
const eventABI = [
    'event ContractCall(address indexed sender, string destinationChain, string destinationContractAddress, bytes32 indexed payloadHash, bytes payload)',
];

const iface = new ethers.utils.Interface(eventABI);

async function processContractCallEvent(sourceChain, txHash, dryRun = false) {
    apiEvent = await constructAPIEvent(sourceChain, txHash);
    console.log(apiEvent);

    if (dryRun === true) {
        return;
    }

    response = submitContractCallEvent(apiEvent);
    console.log(response);
}

async function constructAPIEvent(sourceChain, txHash) {
    try {
        const sourceChainConfig = getChainConfig(sourceChain);

        const provider = new ethers.providers.JsonRpcProvider(sourceChainConfig.rpc);

        // Fetch transaction receipt
        const receipt = await provider.getTransactionReceipt(txHash);

        if (!receipt) {
            throw new Error('Transaction receipt not found');
        }

        // Find the relevant log
        const TOPIC = iface.getEventTopic('ContractCall');
        const relevantLog = receipt.logs.find((log) => log.topics[0] === TOPIC);

        if (!relevantLog) {
            throw new Error('Relevant log not found');
        }

        // Decode the event data
        const decodedLog = iface.parseLog(relevantLog);

        // Extract data from the decoded log
        const eventIndex = receipt.logs.indexOf(relevantLog);
        const eventID = `${txHash}-${eventIndex}`;
        const sourceAddress = decodedLog.args.sender;
        const destinationChain = decodedLog.args.destinationChain;
        const destinationAddress = decodedLog.args.destinationContractAddress;
        const payloadHash = ethers.utils.base64.encode(decodedLog.args.payloadHash);
        const payload = ethers.utils.base64.encode(decodedLog.args.payload);

        // Fetch block data for timestamp
        const block = await provider.getBlock(receipt.blockNumber);
        const timestamp = new Date(block.timestamp * 1000).toISOString();

        // Construct the event object
        return {
            destinationChain,
            eventID,
            message: {
                destinationAddress,
                messageID: eventID,
                payloadHash,
                sourceAddress,
                sourceChain,
            },
            meta: {
                finalized: true, // Set to true if the event is finalized
                fromAddress: receipt.from,
                timestamp,
                txID: txHash,
            },
            payload,
            type: 'CALL',
        };
    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    }
}

async function submitContractCallEvent(apiEvent) {
    sourceChain = apiEvent.message.sourceChain;
    const response = await axios.post(`${GMP_API_URL}/chains/${sourceChain}/events`, {
        events: [apiEvent],
    });

    console.log('API Response:', response.data);
    return response.data;
}

module.exports = {
    processContractCallEvent,
};
