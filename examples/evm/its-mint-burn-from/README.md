# ITS Custom Token Example

This example demonstrates how to use the ITS with a custom token implementation with the `MINT_BURN_FROM` token manager type.

The token will be minted/burned on transfers. The token needs to give mint permission to the token manager, but burning happens via an approval.

### Prerequisite

Make sure you've already followed the following steps:

-   [Setup environment variables](/README.md#set-environment-variables)
-   [Run the local chains](/README.md#running-the-local-chains)

### Deployment

To deploy the custom token, use the following command:

```bash
npm run deploy evm/its-custom-token [local|testnet]
```

The aforementioned command pertains to specifying the intended environment for a project to execute on. It provides the option to choose between local and testnet environments by appending either `local` or `testnet` after the command. 

An example of its usage is demonstrated as follows: `npm run deploy evm/its-mint-burn-from local` or `npm run deploy evm/its-mint-burn-from testnet`. 

### Execution

To execute the example, use the following command:

```bash
npm run execute evm/its-mint-burn-from [local|testnet] ${srcChain} ${destChain} ${amount} ${salt}
```

### Parameters

-   `srcChain`: The blockchain network from which the message will be relayed. Acceptable values include "Moonbeam", "Avalanche", "Fantom", "Ethereum", and "Polygon". Default value is Avalanche.
-   `destChain`: The blockchain network to which the message will be relayed. Acceptable values include "Moonbeam", "Avalanche", "Fantom", "Ethereum", and "Polygon". Default value is Fantom.
-   `amount`: The amount of token to send. The default is 1000.
-   `salt`: The 32 byte salt to use for the token. The default is a random salt depending on the proccess that runs the example.

## Example

This example deploys the custom token on a local network, registers it with the Interchain Token Service and sends 1234 of said token from Fantom to Avalanche.

```bash
npm run deploy evm/its-mint-burn-from local
npm run execute evm/its-mint-burn-from local "Fantom" "Avalanche" 1234 0xa457d6C043b7288454773321a440BA8866D47f96D924D4C38a50b2b0698fae46
```

The output will be:

```
Registering custom token at for Fantom
Registering custom token at for Avalanche
Minting 1234 of custom tokens to 0xBa86A5719722B02a5D5e388999C25f3333c7A9fb
--- Initially ---
Balance at Avalanche is 0
Sending 1234 of token 0x8EF758F0D49c53827b47962fA30BDA7e198a4D14 to Avalanche
--- After ---
Balance at Avalanche is 1234
```
