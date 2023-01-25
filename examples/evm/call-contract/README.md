# Call Contract Example

Relay a message from source-chain to destination-chain.

Deploy:

```bash
npm run deploy evm/call-contract [local|testnet]
```

Run the test:

```bash
npm run execute evm/call-contract [local|testnet] ${srcChain} ${destChain} ${message}
```

**Default Values**:

-   `srcChain` is `Avalanche`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `destChain` is `Fantom`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `message` is `Hello World`

## Example

```bash
npm run deploy evm/call-contract local
npm run execute evm/call-contract local "Moonbeam" "Avalanche" "Hello World"
```

Output:

```
--- Initially ---
value at Avalanche is
--- After ---
value at Avalanche is Hello World
```
