# Headers

Informs destination-chain of the last header of source-chain.

### Deployment

To deploy the example, use the following command:

```bash
npm run deploy evm/headers [local|testnet]
```

### Execution

To execute the example, use the following command:

```bash
npm run execute evm/headers [local|testnet] ${srcChain} ${destChain}
```

**Default Values**:

-   `srcChain` is `Avalanche`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `destChain` is `Fantom`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon

## Example

```bash
npm run deploy evm/headers local
npm run execute evm/headers local "Fantom" "Moonbeam"
```

The output will be:

```
Success!
```

This example deploys a relay contract on the destination-chain and calls the function to inform the latest header of the source-chain. It is assumed that both the source-chain and destination-chain are connected via Axelar. An example returns "Success!" on successful execution of the header transfer from the source-chain to the destination-chain.
