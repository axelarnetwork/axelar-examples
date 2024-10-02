const fs = require('fs');
const axios = require('axios');
const ethers = require('ethers');
const { getConfig, getChainConfig } = require('../config/config.js');
const { processMessageApprovedEvent } = require('./approve-event.js');
const { processMessageExecutedEvent } = require('./execute-event.js');
const AmplifierGMPTest = require('../../../artifacts/examples/amplifier/contracts/AmplifierGMPTest.sol/AmplifierGMPTest.json');
require('dotenv').config();

const { gmpAPIURL, httpsAgent } = getConfig();
var dryRun = false;

const messageIdToCommandId = {};

async function pollTasks({ chainName, pollInterval, dryRunOpt }) {
    if (dryRunOpt) {
        console.log('Dry run enabled');
        dryRun = true;
    }

    const chainConfig = getChainConfig(chainName);

    const intervalId = setInterval(async () => {
        await getNewTasks(chainConfig, intervalId); // Pass the interval ID to the function
    }, pollInterval);
}

async function getNewTasks(chainConfig, intervalId) {
    latestTask = loadLatestTask(chainConfig.name);

    var urlSuffix = '';

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
            console.log('No new tasks');
            return;
        }

        for (const task of tasks) {
            var payload;
            var destinationAddress;

            if (task.type === 'GATEWAY_TX') {
                console.log('Processing approve task', task.id);
                payload = decodePayload(task.task.executeData);
                destinationAddress = chainConfig.gateway;
                const destTxRecept = await relayApproval(chainConfig.rpc, payload, destinationAddress);
                const { apiEvent } = await processMessageApprovedEvent(chainConfig.name, destTxRecept.transactionHash, '0');
                messageIdToCommandId[apiEvent.message.messageID] = apiEvent.meta.commandID;
            } else if (task.type === 'EXECUTE') {
                console.log('Processing execute task', task.id);
                payload = decodePayload(task.task.payload);

                destinationAddress = task.task.message.destinationAddress;
                const { messageID, sourceAddress, sourceChain } = task.task.message;

                const destTxRecept = await relayExecution(chainConfig.rpc, payload, destinationAddress, {
                    messageID,
                    sourceAddress,
                    sourceChain,
                });
                await processMessageExecutedEvent(chainConfig.name, destTxRecept.transactionHash, sourceChain, messageID, '0');

                clearInterval(intervalId);
                console.log('Polling interval cleared after EXECUTE task completed');
            } else {
                console.warn('Unknown task type:', task.type);
                continue;
            }

            console.log('Task processed:', task.id);
            saveLatestTask(chainConfig.name, task.id);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

function saveLatestTask(chainName, latestTask) {
    fs.writeFileSync(`./latestTask-${chainName}.json`, JSON.stringify(latestTask));
}

function loadLatestTask(chainName) {
    try {
        return fs.readFileSync(`./latestTask-${chainName}.json`, 'utf8');
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

    console.log('Relaying approval tx to chain:', { rpc, payload, destinationAddress });
    const tx = await wallet.sendTransaction({
        to: destinationAddress,
        data: payload,
        gasLimit: ethers.utils.hexlify(500000),
    });

    const destTxRecept = await tx.wait();

    console.log('Transaction confirmed', { txHash: destTxRecept.transactionHash });
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

    console.log('Relaying execution tx to chain:', { rpc, payload, destinationAddress });

    const executable = new ethers.Contract(destinationAddress, AmplifierGMPTest.abi, wallet);

    const tx = await executable.execute(commandID, sourceChain, sourceAddress, payload);

    const destTxRecept = await tx.wait();

    console.log('Transaction confirmed', { txHash: destTxRecept.transactionHash });
    return destTxRecept;
}

function decodePayload(executeData) {
    const buffer = Buffer.from(executeData, 'base64');
    return '0x' + buffer.toString('hex');
}

module.exports = {
    pollTasks,
};
