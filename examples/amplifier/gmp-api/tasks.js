const fs = require('fs');
const axios = require('axios');
const ethers = require('ethers');
const { getConfig, getChainConfig } = require('../config/config.js');
const { processMessageApprovedEvent: recordMessageApprovedEvent } = require('./approve-event.js');
const { processMessageExecutedEvent: recordMessageExecutedEvent } = require('./execute-event.js');
const AmplifierGMPTest = require('../../../artifacts/examples/amplifier/contracts/AmplifierGMPTest.sol/AmplifierGMPTest.json');
require('dotenv').config();

const { gmpAPIURL, httpsAgent } = getConfig();
let dryRun = false;

// This field is only relevant for EVM relaying. For EVM chains, commandID is still required in the 'execute' function on the destination chain
// Because the unifying identifier between APPROVE and EXECUTE events is the messageID, this mapping helps to record the relation between those events for a single GMP tx
const messageIdToCommandId = {};

async function pollTasks({ chainName, pollInterval, dryRunOpt }) {
    if (dryRunOpt) {
        console.log('Dry run enabled');
        dryRun = true;
    }

    const chainConfig = getChainConfig(chainName);

    const intervalId = setInterval(async () => {
        await getNewTasks(chainConfig, intervalId);
    }, pollInterval);
}

async function getNewTasks(chainConfig, intervalId) {
    latestTask = loadLatestTask(chainConfig.name);

    let urlSuffix = '';

    if (latestTask !== '') {
        urlSuffix = `?after=${latestTask}`;
    }

    const url = `${gmpAPIURL}/chains/${chainConfig.name}/tasks${urlSuffix}`;

    console.log('Polling tasks on:', url);

    try {
        const response = await axios({
            method: 'get',
            url,
            httpsAgent,
        });

        const tasks = response.data.tasks;

        if (tasks.length === 0) {
            console.log('No new tasks\n');
            return;
        }

        for (const task of tasks) {
            await processTask(task, chainConfig, intervalId);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

async function processTask(task, chainConfig, intervalId) {
    switch (task.type) {
        case 'GATEWAY_TX':
            await processApproval(task, chainConfig);
            break;
        case 'EXECUTE':
            await processExecute(task, chainConfig, intervalId);
            break;
        default:
            console.warn('Unknown task type:', task.type);
            break;
    }

    console.log('Task processed:', task.id, '\n');
    saveLatestTask(chainConfig.name, task.id);
}

async function processApproval(task, chainConfig) {
    console.log('Processing approve task', task.id);
    const payload = decodePayload(task.task.executeData);
    const destinationAddress = chainConfig.gateway;

    const destTxRecept = await relayApproval(chainConfig.rpc, payload, destinationAddress);
    const { apiEvent } = await recordMessageApprovedEvent(chainConfig.name, destTxRecept.transactionHash, '0');
    messageIdToCommandId[apiEvent.message.messageID] = apiEvent.meta.commandID;
}

async function processExecute(task, chainConfig, intervalId) {
    console.log('Processing execute task', task.id);
    const payload = decodePayload(task.task.payload);
    const destinationAddress = task.task.message.destinationAddress;
    const { messageID, sourceAddress, sourceChain } = task.task.message;

    const destTxRecept = await relayExecution(chainConfig.rpc, payload, destinationAddress, {
        messageID,
        sourceAddress,
        sourceChain,
    });
    await recordMessageExecutedEvent(chainConfig.name, destTxRecept.transactionHash, sourceChain, messageID, '0');
    clearInterval(intervalId);
    console.log('Polling interval cleared after EXECUTE task completed');
}

function saveLatestTask(chainName, latestTask) {
    fs.writeFileSync(`./examples/amplifier/config/latestTasks/latestTask-${chainName}.json`, JSON.stringify(latestTask));
}

function loadLatestTask(chainName) {
    try {
        return fs.readFileSync(`./examples/amplifier/config/latestTasks/latestTask-${chainName}.json`, 'utf8');
    } catch (error) {
        return '';
    }
}

async function relayApproval(rpc, payload, destinationAddress) {
    if (dryRun) {
        console.log('dryrun mode');
        return;
    }

    const provider = new ethers.providers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(process.env.EVM_PRIVATE_KEY, provider);

    console.log('Relaying approval tx to chain');
    const tx = await wallet.sendTransaction({
        to: destinationAddress,
        data: payload,
        gasLimit: ethers.utils.hexlify(500000),
    });

    const destTxRecept = await tx.wait();

    console.log('Transaction confirmed: ', destTxRecept.transactionHash);
    return destTxRecept;
}

async function relayExecution(rpc, payload, destinationAddress, { messageID, sourceAddress, sourceChain }) {
    if (dryRun) {
        console.log('dryrun mode');
        return;
    }

    const provider = new ethers.providers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(process.env.EVM_PRIVATE_KEY, provider);
    const commandID = messageIdToCommandId[messageID];

    console.log('Relaying execution tx to chain');

    const executable = new ethers.Contract(destinationAddress, AmplifierGMPTest.abi, wallet);

    const tx = await executable.execute(commandID, sourceChain, sourceAddress, payload);

    const destTxRecept = await tx.wait();

    console.log('Transaction confirmed: ', destTxRecept.transactionHash);
    return destTxRecept;
}

function decodePayload(executeData) {
    const buffer = Buffer.from(executeData, 'base64');
    return '0x' + buffer.toString('hex');
}

module.exports = {
    pollTasks,
};
