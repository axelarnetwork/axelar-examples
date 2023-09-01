# Call Contract Example

This example demonstrates how to relay a GMP message from a Cosmos-based source-chain to an EVM-based destination-chain.

### Prerequisite

Make sure you've already followed the following steps:

-   [Setup environment variables](/README.md#set-environment-variables)
-   [Run the local chains](/README.md#running-the-local-chains)

### Deployment

To deploy the destination contract, use the command below. This deploys the receiving destination contracts on EVM chains.

```bash
npm run deploy evm/call-contract [local|testnet]
```

The aforementioned command pertains to specifying the intended environment for a project to execute on. It provides the option to choose between local and testnet environments by appending either `local` or `testnet` after the command.

An example of its usage is demonstrated as follows: `npm run deploy evm/call-contract local` or `npm run deploy evm/call-contract testnet`.

### Execution

To execute the example, use the following command:

```bash
npm run execute cosmos/call-contract [local|testnet] ${srcChain} ${destChain} ${message}
```

### Parameters

-   `srcChain`: The blockchain network from which the message will be relayed. Acceptable values include "Osmosis".
-   `destChain`: The blockchain network to which the message will be relayed. Acceptable values include "Moonbeam", "Avalanche", "Fantom", "Ethereum", and "Polygon". Default value is Fantom.
-   `message`: The message to be relayed between the chains. Default value is "Hello World".

## Example

This example deploys the contract on a local network and relays a message "Hello World" from Osmosis to Avalanche.

```bash
npm run deploy evm/call-contract testnet
npm run execute cosmos/call-contract testnet "Osmosis" "Avalanche" "Hello World"
```

The output will be:

```
--- Initially ---
value at Avalanche is
--- After ---
value at Avalanche is Hello World
```
