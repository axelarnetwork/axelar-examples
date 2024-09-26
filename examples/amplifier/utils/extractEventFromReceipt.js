const { providers, ethers } = require('ethers');
const { getConfig } = require('../config');

const config = getConfig().chains;

function getCallContractEventIndex(transactionReceipt) {
    const callContractEventSignature = 'ContractCall(address,string,string,bytes32,bytes)';
    const callContractTopic = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(callContractEventSignature));

    for (let i = 0; i < transactionReceipt.logs.length; i++) {
        const log = transactionReceipt.logs[i];

        if (log.topics[0] === callContractTopic) {
            return log.logIndex;
        }
    }

    return -1;
}

async function extractEventFromReceipt(receipt, params) {
    const contractABI = [
        'event ContractCall(address indexed sender, string destinationChain, string destinationContractAddress, bytes32 indexed payloadHash, bytes payload)',
    ];

    const iface = new ethers.utils.Interface(contractABI);

    const eventIndex = getCallContractEventIndex(receipt);
    const log = receipt.logs[eventIndex];

    const decodedData = iface.decodeEventLog('ContractCall', log.data, log.topics);

    const provider = new providers.JsonRpcProvider(config['avalanche-fuji'].rpcUrl);

    const block = await provider.getBlock(receipt.blockNumber);

    const destinationChain = decodedData.destinationChain;
    const eventID = `${receipt.transactionHash}-${eventIndex}`;
    const destinationAddress = decodedData.destinationContractAddress;
    const messageID = eventID;
    const payloadHashBase64 = Buffer.from(log.topics[2].startsWith('0x') ? log.topics[2].slice(2) : log.topics[2], 'hex').toString(
        'base64',
    );
    const payloadBase64 = Buffer.from(log.data.startsWith('0x') ? log.data.slice(2) : log.data, 'hex').toString('base64');
    const sourceAddress = receipt.from;
    const sourceChain = params.srcChain;

    const meta = {
        finalized: true,
        fromAddress: receipt.from,
        timestamp: block.timestamp,
        txID: receipt.transactionHash,
    };

    // Create the final event object
    const event = {
        destinationChain,
        eventID,
        message: {
            destinationAddress,
            messageID,
            payloadHash: payloadHashBase64,
            sourceAddress,
            sourceChain,
        },
        meta,
        payload: payloadBase64,
        type: 'CALL',
    };

    return event;
}

module.exports = {
    extractEventFromReceipt,
};
