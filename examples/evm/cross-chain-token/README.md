# Cross-chain Token Transfer

This example demonstrates how to mint tokens on a source-chain and transfer them to a destination-chain.

### Deployment

To deploy the contract, use the following command:

```bash
npm run deploy evm/cross-chain-token [local|testnet]
```

### Execution

To execute the example, use the following command:

```bash
npm run execute evm/cross-chain-token [local|testnet] ${srcChain} ${destChain} ${amount}
```

**Default Values**:

-   `srcChain` is `Avalanche`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `destChain` is `Fantom`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `amount` is `10`

## Example

This example deploys the contract on a local network, mints 1 token on the Ethereum chain and transfers it to the Fantom chain.

```bash
npm run deploy evm/cross-chain-token local
npm run execute evm/cross-chain-token local "Ethereum" "Fantom" 1
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
