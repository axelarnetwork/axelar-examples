const axios = require('axios');
const { ethers } = require('ethers');
const { getConfig, getChainConfig } = require('../config/config.js');

const { gmpAPIURL, httpsAgent } = getConfig();

// ABI for the ContractCall and MessageApproved events
const eventABI = [
    'event MessageApproved(bytes32 indexed commandId, string sourceChain, string messageId, string sourceAddress, address indexed contractAddress, bytes32 indexed payloadHash)',
];

const iface = new ethers.utils.Interface(eventABI);

async function processMessageApprovedEvent(destinationChain, txHash, costAmount = '0', dryRun = false) {
    apiEvent = await constructAPIEvent(destinationChain, txHash, costAmount);

    if (dryRun === true) {
        return;
    }

    response = await submitApproveEvent(apiEvent);
    return { apiEvent, response };
}

async function constructAPIEvent(destinationChain, txHash, costAmount) {
    try {
        const destinationChainConfig = getChainConfig(destinationChain);

        const provider = new ethers.providers.JsonRpcProvider(destinationChainConfig.rpc);

        // Fetch transaction receipt
        const receipt = await provider.getTransactionReceipt(txHash);

        if (!receipt) {
            console.error('Transaction receipt not found');
            return;
        }

        // Find the relevant log
        const TOPIC = iface.getEventTopic('MessageApproved');
        const relevantLog = receipt.logs.find((log) => log.topics[0] === TOPIC);

        if (!relevantLog) {
            console.error('Relevant log not found');
            return;
        }

        // Decode the event data
        const decodedLog = iface.parseLog(relevantLog);

        // Extract data from the decoded log
        const eventIndex = receipt.logs.indexOf(relevantLog);
        const eventID = `${txHash}-${eventIndex}`;
        const commandId = decodedLog.args.commandId;
        const messageId = decodedLog.args.messageId;
        const sourceChain = decodedLog.args.sourceChain;
        const sourceAddress = decodedLog.args.sourceAddress;
        const contractAddress = decodedLog.args.contractAddress;
        const payloadHash = ethers.utils.base64.encode(decodedLog.args.payloadHash);

        // Fetch block data for timestamp
        const block = await provider.getBlock(receipt.blockNumber);
        const timestamp = new Date(block.timestamp * 1000).toISOString();

        // Construct the event object
        return {
            cost: {
                amount: costAmount,
            },
            destinationChain,
            eventID,
            message: {
                destinationAddress: contractAddress,
                messageID: messageId,
                payloadHash,
                sourceAddress,
                sourceChain,
            },
            meta: {
                commandID: commandId,
                finalized: true,
                fromAddress: receipt.from,
                timestamp,
                txID: txHash,
            },
            type: 'MESSAGE_APPROVED',
        };
    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    }
}

async function submitApproveEvent(apiEvent) {
    try {
        const response = await axios.post(
            `${gmpAPIURL}/chains/${apiEvent.destinationChain}/events`,
            {
                events: [apiEvent],
            },
            {
                httpsAgent,
            },
        );
        return response.data;
    } catch (e) {
        console.log('something went wrong', e);
        return [];
    }
}

module.exports = {
    processMessageApprovedEvent,
};
