# Canonical Token

This example demonstrates how to use a canonical token implementation, using the lock/unlock token manager.

### Prerequisite

Make sure you've already followed the following steps:

-   [Setup environment variables](/README.md#set-environment-variables)
-   [Run the local chains](/README.md#running-the-local-chains)

### Deployment

To deploy the contract, use the following command:

```bash
npm run deploy evm/its-canonical-token [local|testnet]
```

The aforementioned command pertains to specifying the intended environment for a project to execute on. It provides the option to choose between local and testnet environments by appending either `local` or `testnet` after the command.

An example of its usage is demonstrated as follows: `npm run deploy evm/call-contract local` or `npm run deploy evm/call-contract testnet`.

### Execution

To execute the example, use the following command:

```bash
npm run execute evm/its-canonical-token [local|testnet] ${srcChain} ${destChain}
```

### Parameters

-   `srcChain`: The blockchain network from which the message will be relayed. Acceptable values include "Moonbeam", "Avalanche", "Fantom", "Ethereum", and "Polygon". Default value is Avalanche.
-   `destChain`: The blockchain network to which the message will be relayed. Acceptable values include "Moonbeam", "Avalanche", "Fantom", "Ethereum", and "Polygon". Default value is Fantom.


## Example

This example deploys the token on Fantom and Avalanche, it registers the token as a canonical token on Fantom and Avalanche. After the token is registered it mints 1000 tokens on Fantom and send them via the Interchain Token Service to Avalanche.

```bash
npm run deploy evm/its-canonical-token local
npm run execute evm/its-canonical-token local "Fantom" "Avalanche"

The output will be:

```
--- Initially ---
Balance at Avalanche is 0
Sending 1000 of token 0xd66057b40bAb218239fBB8906dE52de66e30a12A to Avalanche--- After ---
Balance at Avalanche is 1000```
