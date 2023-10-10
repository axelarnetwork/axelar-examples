# Call Contract Example

This example demonstrates how to relay a message from a source-chain to a destination-chain.

### Prerequisite

Make sure you've already followed the following steps:

-   [Setup environment variables](/README.md#set-environment-variables)
-   [Run the local chains](/README.md#running-the-local-chains)

### Deployment

To deploy the contract, use the following command:

```bash
npm run deploy evm/call-contract [local|testnet]
```

The aforementioned command pertains to specifying the intended environment for a project to execute on. It provides the option to choose between local and testnet environments by appending either `local` or `testnet` after the command. 

An example of its usage is demonstrated as follows: `npm run deploy evm/call-contract local` or `npm run deploy evm/call-contract testnet`. 

### Execution

To execute the example, use the following command:

```bash
npm run execute evm/call-contract [local|testnet] ${srcChain} ${destChain} ${message}
```

### Parameters

-   `srcChain`: The blockchain network from which the message will be relayed. Acceptable values include "Moonbeam", "Avalanche", "Fantom", "Ethereum", and "Polygon". Default value is Avalanche.
-   `destChain`: The blockchain network to which the message will be relayed. Acceptable values include "Moonbeam", "Avalanche", "Fantom", "Ethereum", and "Polygon". Default value is Fantom.
-   `message`: The message to be relayed between the chains. Default value is "Hello World".

## Example

This example deploys the contract on a local network and relays a message "Hello World" from Moonbeam to Avalanche.

```bash
npm run deploy evm/call-contract local
npm run execute evm/call-contract local "Fantom" "Avalanche" "Hello World"
```

The output will be:

```
--- Initially ---
value at Avalanche is
--- After ---
value at Avalanche is Hello World
```

## Tutorial

For a complete working example of using `callContract` on testnet to build a full-stack interchain decentralized application with Next.js, Solidity, and Axelar General Message Passing (GMP) to send messages from one blockchain to another, check out the following tutorial:

[How to Build a Full-Stack Interchain Application With Next.js, Solidity & Axelar](https://axelar.network/blog/how-to-build-interchain-dapp-with-next.js-solidity-and-Axelar).

This in-depth tutorial walks through building a full-stack interchain decentralized application with Next.js, Solidity, using Axelar's cross-chain communication protocol.

This tutorial guides you through a simple three-step process that empowers users to:
Connect their wallet.
Enter their desired message for cross-chain interaction.
Send the message from Binance to Avalanche.
