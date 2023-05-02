# Send ack

Send a 2-way message from source-chain to destination-chain and an "executed" acknowledgement is sent back to the source chain.


### Prerequisite

Make sure you've already followed the following steps:

-   [Setup environment variables](/README.md#set-environment-variables)
-   [Run the local chains](/README.md#running-the-local-chains)

## Deployment

```bash
npm run deploy evm/send-ack [local|testnet]
```

The aforementioned command pertains to specifying the intended environment for a project to execute on. It provides the option to choose between local and testnet environments by appending either `local` or `testnet` after the command. 

An example of its usage is demonstrated as follows: `npm run deploy evm/send-ack local` or `npm run deploy evm/send-ack testnet`. 

### Execution

```bash
npm run execute evm/send-ack [local|testnet] ${srcChain} ${destChain} ${message}
```

**Default Values**:

-   `srcChain` is `Avalanche`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `destChain` is `Fantom`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `message` is `Hello World`

## Example

```bash
npm run deploy evm/send-ack local
npm run execute evm/send-ack local "Avalanche" "Fantom" 'Received'
```

**Output:**

```
--- Initially ---
SendAckReceiverImplementation at Moonbeam has 0 messages and the last one is "".
--- After ---
SendAckReceiverImplementation at Moonbeam has 1 messages and the last one is "Received".
```
