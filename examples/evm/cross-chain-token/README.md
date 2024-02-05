# Cross-chain Token Transfer

This example demonstrates how to mint tokens on a source chain and transfer them to a destination chain.

>The cross-chain token transfer method described below provides a basic example for reference but is not recommended for production use cases. For token bridges or transfers in testnet or mainnet, we recommend using the [Axelar Interchain Token Service (ITS)](https://axelar.network/its). 


## Axelar Interchain Token Service (ITS) Overview
The Axelar Interchain Token Service provides a robust, managed service for creating cross-chain tokens and bridges. Key benefits include:

- Create new ERC-20 tokens available on multiple chains
- Bridge existing ERC-20 tokens across chains
- Flexibility for standardized tokens or custom logic
- Built-in security, monitoring, and reliability features
- Easy integration into dApps with SDKs

See the [ITS docs](https://docs.axelar.dev/dev/send-tokens/interchain-tokens) for usage, APIs, and more details.

## Local Example
The example below provides a basic local implementation for reference.

### Prerequisite

Make sure you've already followed the following steps:

-   [Setup environment variables](/README.md#set-environment-variables)
-   [Run the local chains](/README.md#running-the-local-chains)

### Deployment

To deploy the contract, use the following command:

```bash
npm run deploy evm/cross-chain-token [local|testnet]
```

The command above pertains to specifying a project's intended environment to execute. It provides the option to choose between local and testnet environments by appending either `local` or `testnet` after the command. 

An example of its usage is `npm run deploy evm/cross-chain-token local` or `npm run deploy evm/cross-chain-token testnet`. 

### Execution

To execute the example, use the following command:

```bash
npm run execute evm/cross-chain-token [local|testnet] ${srcChain} ${destChain} ${amount}
```

**Default Values**:

-   `srcChain` is `Avalanche`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `destChain` is `Fantom`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `amount` is `10`

### Example of Cross-Chain Token Deployment and Transfer

This example deploys the contract on a local network, mints one token on the Ethereum chain, and transfers it to the Fantom chain.

```bash
npm run deploy evm/cross-chain-token local
npm run execute evm/cross-chain-token local "Avalanche" "Fantom" 1
```

The output will be:

```
--- Initially ---
Balance at Ethereum is 0
Balance at Fantom is 0
--- After getting some token on the source chain ---
Balance at Ethereum is 1
Balance at Fantom is 0
--- After ---
Balance at Ethereum is 0
Balance at Fantom is 1
```
