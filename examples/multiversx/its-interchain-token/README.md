# ITS Interchain Token Example

This example demonstrates how to deploy Interchain Tokens that are connected across EVM chains and MultiversX, and how to send some tokens across.

### Prerequisite

Make sure you've already followed the following steps:

-   [Setup environment variables](/README.md#set-environment-variables)
-   [Run the local chains](/README.md#running-the-local-chains)
-   [Setup MultiversX](../README.md)

### Execution

To execute the example, use the following command:

```bash
npm run execute multiversx/its-interchain-token local ${srcChain} ${destChain} ${name} ${symbol} ${decimals} ${amount} ${salt}
```

### Parameters

-   `srcChain`: The blockchain network from which the message will be relayed. Acceptable values include "multiversx" "Moonbeam", "Avalanche", "Fantom", "Ethereum", and "Polygon". Default value is Avalanche.
-   `destChain`: The blockchain network to which the message will be relayed. Acceptable values include "multiversx", "Avalanche", "Fantom", "Ethereum", and "Polygon". Default value is multiversx.
-   `name`, `symbol`, `decimals`: These will be used for the deployed Interchain Token. Defaults are "Interchain Token", "IT" and 18 respectively.
-   `amount`: The amount of token to send. The default is 1000.
-   `salt`: The 32 byte salt to use for the token. The default is a random salt depending on the process that runs the example.

## Example

This example deploys an Interchain Token ["My Token" "MT" 12] on a local network and sends 1234 of it from Avalanche to multiversx.

```bash
npm run execute multiversx/its-interchain-token local "Avalanche" "multiversx" "My Token" "MT" 12 1234 0xa457d6C043b7288454773321a440BA8866D47f96D924D4C38a50b2b0698fae46
```

The output will be:

```
Deploying interchain token [My Token, MT, 12] at Avalanche
Deploying remote interchain token from Avalanche to MultiversX
--- Initially ---
Balance at MultiversX is 0
Sending 1234 of token 0x984E06EcAB266549b1d4c5407aAbD3a0A095B826 to MultiversX
--- After ---
Balance at MultiversX is 1234
```
