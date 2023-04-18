# Nonced Execution Example

This example demonstrates how to guarantee the order of execution at the destination chain.

Imagine there are two transactions submitted from the your cross-chain contract at the same block from the source chain.

The dapp expects that the first transaction must be executed before the second transaction. Unfortunately, the second transaction may be the first transaction to get executed by the executor service at the destination contract, resulting in an undesired outcome for the dapp.

To prevent this from happening, we can implement the nonced execution pattern. With this pattern, the second transaction will be reverted because the nonce is not in order. Shortly after, the executor service executes the first transaction, and then it re-executes the second transaction.

By implementing this pattern, we can guarantee that the transactions will be executed in the correct order on-chain.

### Prerequisite

Make sure you've already followed the following steps:

-   [Setup environment variables](/README.md#set-environment-variables)
-   [Run the local chains](/README.md#running-the-local-chains)

### Deployment

To deploy the contract, use the following command:

```bash
npm run deploy evm/nonced-execution [local|testnet]
```

The aforementioned command pertains to specifying the intended environment for a project to execute on. It provides the option to choose between local and testnet environments by appending either `local` or `testnet` after the command. 

An example of its usage is demonstrated as follows: `npm run deploy evm/nonced-execution local` or `npm run deploy evm/nonced-execution testnet`. 

### Execution

To execute the example, use the following command:

```bash
npm run execute evm/nonced-execution [local|testnet] ${srcChain} ${destChain} ${message}
```

### Parameters

-   `srcChain`: The blockchain network from which the message will be relayed. Acceptable values include "Moonbeam", "Avalanche", "Fantom", "Ethereum", and "Polygon". Default value is Avalanche.
-   `destChain`: The blockchain network to which the message will be relayed. Acceptable values include "Moonbeam", "Avalanche", "Fantom", "Ethereum", and "Polygon". Default value is Fantom.
-   `message`: The message to be relayed between the chains. Default value is "Hello World".

## Example

This example deploys the contract on a local network and relays a message "Hello World" from Moonbeam to Avalanche.

```bash
npm run deploy evm/nonced-execution local
npm run execute evm/nonced-execution local "Fantom" "Avalanche" "Hello World"
```

The output will be:

```
--- Initially ---
Avalanche -> Fantom message:
--- Waiting for message to be received ---
--- After ---
Avalanche -> Fantom message: Hello, the time is 1678888740012.
```
