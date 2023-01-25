# Call Contract Example

This example demonstrates how to relay a message from a source-chain to a destination-chain.

To deploy the contract, use the following command:

```bash
npm run deploy evm/call-contract [local|testnet]
```

To execute the example, use the following command:

```bash
npm run execute evm/call-contract [local|testnet] ${srcChain} ${destChain} ${message}
```

**Default Values**:

-   The default value for `srcChain` is `Avalanche`. Acceptable values include "Moonbeam", "Avalanche", "Fantom", "Ethereum", and "Polygon"
-   The default value for `destChain` is `Fantom`. Acceptable values include "Moonbeam", "Avalanche", "Fantom", "Ethereum", and "Polygon"
-   The default value for `message` is `Hello World`

## Example

This example deploys the contract on a local network and relays a message "Hello World" from Moonbeam to Avalanche.

```bash
npm run deploy evm/call-contract local
npm run execute evm/call-contract local "Moonbeam" "Avalanche" "Hello World"
```

The output will be:

```
--- Initially ---
value at Avalanche is
--- After ---
value at Avalanche is Hello World
```
