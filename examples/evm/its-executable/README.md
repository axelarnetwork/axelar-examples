# ITS Executable Example

This example demonstrates how to relay a message from a source-chain to a destination-chain through the Interchain Token Service, alongside some token.

### Prerequisite

Make sure you've already followed the following steps:

-   [Setup environment variables](/README.md#set-environment-variables)
-   [Run the local chains](/README.md#running-the-local-chains)

### Deployment

To deploy the contract, use the following command:

```bash
npm run deploy evm/its-executable [local|testnet]
```

The aforementioned command pertains to specifying the intended environment for a project to execute on. It provides the option to choose between local and testnet environments by appending either `local` or `testnet` after the command. 

An example of its usage is demonstrated as follows: `npm run deploy evm/its-executable local` or `npm run deploy evm/its-executable testnet`. 

### Execution

To execute the example, use the following command:

```bash
npm run execute evm/its-executable [local|testnet] ${srcChain} ${destChain} ${message}
```

### Parameters

-   `srcChain`: The blockchain network from which the message will be relayed. Acceptable values include "Moonbeam", "Avalanche", "Fantom", "Ethereum", and "Polygon". Default value is Avalanche.
-   `destChain`: The blockchain network to which the message will be relayed. Acceptable values include "Moonbeam", "Avalanche", "Fantom", "Ethereum", and "Polygon". Default value is Fantom.
-   `message`: The message to be relayed between the chains. Default value is "Hello World".
-   `amount`: The message to be relayed between the chains. Default value is "Hello ${destination chain} from ${source chain}, the time is ${current time}".

## Example

This example deploys the contract on a local network and relays a message "Hello World" from Fantom to Avalanche with 100 tokens attached.

```bash
npm run deploy evm/its-executable local
npm run execute evm/its-executable local "Fantom" "Avalanche" "Hello World" 100
```

The output will be:

```
Deploying interchain token [Interchain Token, IT, 18] at Fantom
Deploying remote interchain token from Fantom to Avalanche
--- Initially ---
Balance at Avalanche is 0
Last message at Avalanche is 
Sending 100 of token 0x6426111752cFd7c8082fC8e6fBb87Ddf08Db4757 to Avalanche and executing with it.
--- After ---
Balance at Avalanche is 100
Last message at Avalanche is Hello World
```
