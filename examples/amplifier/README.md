## Introduction

This repo provides a code example for interacting with the Amplifier GMP API to relay transactions to the Axelar network and listen to Axelar events.

Please see the accompanying docs here:

### Relayer architecture overview

https://docs.axelar.dev/dev/amplifier/chain-integration/relay-messages/automatic/

### GMP API endpoint and schema definitions

https://bright-ambert-2bd.notion.site/Amplifier-GMP-API-EXTERNAL-911e740b570b4017826c854338b906c8

## Onboarding

1. In order to onboard your relayer to be able to leverage the GMP API, please follow these initial steps
    - https://www.notion.so/bright-ambert-2bd/Amplifier-GMP-API-Authentication-EXTERNAL-113c53fccb77807caeeff9882b883a4c?pvs=4
    - Please reach out to the Interop Labs team for access

## Repository Setup

1. Clone this repo.
2. Install dependencies and build contracts:
    ```bash
    npm install
    npm run build
    ```
3. Go to amplifier examples directory
    ```
    cd examples/amplifier
    ```
4. Copy `.env.example` into `.env` and set up the following environment variables:
    ```bash
    GMP_API_URL=
    ENVIRONMENT= # e.g. devnet-amplifier, testnet, or mainnet
    CRT_PATH= # e.g. './client.crt'
    KEY_PATH= # e.g. './client.key'
    ```

## Run the example

```bash
    node examples/amplifier/index.js -s avalanche-fuji -d xrpl-evm-sidechain -m 'hi there'
```

The script above is an end-to-end example of invoking a GMP call on the `devnet-amplifier` environment. It:

1. deploys an example executable contract on the specified source (`avalanche-fuji`) and destination (`xrpl-evm-sidechain`) chains
    ```javascript
    // examples/amplifier/index.js
    const srcContractDeployment = await deploy(sourceChain);
    const destContract = await deploy(destinationChain);
    ```
2. invokes a GMP call on `avalanche-fuji` and invokes `processContractCallEvent` to index the event. The `processContractCallEvent` generates an `CallEvent` (please see [GMP API endpoint and schema definitions](README.md#gmp-api-endpoint-and-schema-definitions)) and sends to to the `/events` endpoint.

    ```javascript
    // examples/amplifier/utils/gmp.js
    const gmp = async ({ sourceChain, destinationChain, message, destinationContractAddress, srcContractAddress }) => {
        const provider = new providers.JsonRpcProvider(getChainConfig(sourceChain).rpc);
        const wallet = new Wallet(process.env.EVM_PRIVATE_KEY, provider);
        const srcContract = new ethers.Contract(srcContractAddress, AmplifierGMPTest.abi, wallet);

        try {
            const tx = await srcContract.setRemoteValue(destinationChain, destinationContractAddress, message);
            const transactionReceipt = await tx.wait();
            console.log(`Initiated GMP event on ${sourceChain}, tx hash: ${transactionReceipt.transactionHash}`);

            await sleep(10000); // allow for gmp event to propagate before triggering indexing

            processContractCallEvent(sourceChain, transactionReceipt.transactionHash, true);
        } catch (error) {
            throw new Error(`Error calling contract: ${error}`);
        }
    };
    ```

3. initiates a poll on the `/tasks` endpoint to listen for messages that are processed and ready to be relayed to your destination chain.

    ```javascript
    // examples/amplifier/index.js

    main(null).then(() => pollTasks({ chainName: options.destinationChain, pollInterval: 10000, dryRunOpt: false }));
    ```

    ```javascript
    // examples/amplifier/gmp-api/tasks.js

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
    ```

    - In this particular example, there are two events we expect to arise from the `/tasks` endpoint:

        - `GATEWAY_TX` for approved messages on the Amplifier network ready to be relayed to the destination chain gateway, and they are processed in the following snippet by relaying the transaction to the destination chain and recording the event on the GMP API.

        The `recordMessageApprovedEvent` function generates an `MessageApprovedEvent` (please see [GMP API endpoint and schema definitions](README.md#gmp-api-endpoint-and-schema-definitions)) extracted from the destination chain tx receipt and sends to to the `/events` endpoint.

        ```javascript
        // examples/amplifier/gmp-api/tasks.js

        // Note: The `messageIdToCommandID` mapping is only relevant for EVM relaying. For EVM chains, commandID is still required in the 'execute' function on the destination chain
        // Because the unifying identifier between APPROVE and EXECUTE events is the messageID, this mapping helps to record the relation between those events for a single GMP tx
        const messageIdToCommandId = {};

        async function processApproval(task, chainConfig) {
            console.log('Processing approve task', task.id);
            const payload = decodePayload(task.task.executeData);
            const destinationAddress = chainConfig.gateway;

            const destTxRecept = await relayApproval(chainConfig.rpc, payload, destinationAddress);
            const { apiEvent } = await recordMessageApprovedEvent(chainConfig.name, destTxRecept.transactionHash, '0');
            messageIdToCommandId[apiEvent.message.messageID] = apiEvent.meta.commandID;
        }
        ```

        - `EXECUTE` for the payload of the GMP message to be executed on the executable on the destination chain.

        The `recordMessageExecutedEvent` function generates an `MessageExecutedEvent` (please see [GMP API endpoint and schema definitions](README.md#gmp-api-endpoint-and-schema-definitions)) extracted from the destination chain tx receipt and sends to to the `/events` endpoint.

        ```javascript
        // examples/amplifier/gmp-api/tasks.js

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
        ```
