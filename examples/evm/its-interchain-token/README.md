# ITS Interchain Token Example

This example demonstrates how to deploy Interchain Tokens that are connected across EVM chains, and how to send some tokens across.

### Prerequisite

Make sure you've already followed the following steps:

-   [Setup environment variables](/README.md#set-environment-variables)
-   [Run the local chains](/README.md#running-the-local-chains)

### Deployment

To deploy the contract, use the following command:

```bash
npm run deploy evm/its-interchain-token [local|testnet]
```

The aforementioned command pertains to specifying the intended environment for a project to execute on. It provides the option to choose between local and testnet environments by appending either `local` or `testnet` after the command. 

An example of its usage is demonstrated as follows: `npm run deploy evm/its-interchain-token local` or `npm run deploy evm/its-interchain-token testnet`. 

### Execution

To execute the example, use the following command:

```bash
npm run execute evm/its-interchain-token [local|testnet] ${srcChain} ${destChain} ${name} ${symbol} ${decimals} ${amount} ${salt}
```

### Parameters

-   `srcChain`: The blockchain network from which the message will be relayed. Acceptable values include "Moonbeam", "Avalanche", "Fantom", "Ethereum", and "Polygon". Default value is Avalanche.
-   `destChain`: The blockchain network to which the message will be relayed. Acceptable values include "Moonbeam", "Avalanche", "Fantom", "Ethereum", and "Polygon". Default value is Fantom.
-   `name`, `symbol`, `decimals`: These will be used for the deployed Interchain Token. Defaults are "Interchain Token", "IT" and 18 respectively.
-   `amount`: The amount of token to send. The default is 1000.
-   `salt`: The 32 byte salt to use for the token. The default is a random salt depending on the proccess that runs the example.

## Example

This example deploys the an Interchain Token ["My Token" "MT" 12] on a local network and sends 1234 of it from Fantom to Avalanche.

```bash
npm run execute evm/its-interchain-token local "Fantom" "Avalanche" "My Token" "MT" 12 1234 0xa457d6C043b7288454773321a440BA8866D47f96D924D4C38a50b2b0698fae46
```

The output will be:

```
Deploying interchain token [My Token, MT, 12] at Fantom
Deploying remote interchain token from Fantom to Avalanche
--- Initially ---
Balance at Avalanche is 0
Sending 1234 of token 0x984E06EcAB266549b1d4c5407aAbD3a0A095B826 to Avalanche
--- After ---
Balance at Avalanche is 1234
```
