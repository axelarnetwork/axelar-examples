const axios = require('axios');
const { ethers } = require('ethers');
const { getConfig, getChainConfig } = require('../config/config.js');

const { gmpAPIURL, httpsAgent } = getConfig();

// ABI for the ContractCall and MessageExecuted events
const eventABI = ['event MessageExecuted(bytes32 indexed commandId)'];

const iface = new ethers.utils.Interface(eventABI);

async function processMessageExecutedEvent(destinationChain, txHash, sourceChain, messageID, costAmount = '0', dryRun = false) {
    apiEvent = await constructMessageExecutedAPIEvent(destinationChain, txHash, sourceChain, messageID, costAmount);

    if (dryRun === true) {
        return;
    }

    return submitMessageExecutedEvent(apiEvent);
}

async function constructMessageExecutedAPIEvent(destinationChain, txHash, sourceChain, messageID, costAmount) {
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
        const TOPIC = iface.getEventTopic('MessageExecuted');
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
        const commandID = decodedLog.args.commandId;

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
            messageID,
            meta: {
                commandID,
                finalized: true,
                fromAddress: receipt.from,
                timestamp,
                txID: txHash,
            },
            sourceChain,
            status: 'SUCCESSFUL',
            type: 'MESSAGE_EXECUTED',
        };
    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    }
}

async function submitMessageExecutedEvent(apiEvent) {
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
    processMessageExecutedEvent,
};
