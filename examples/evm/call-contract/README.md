# Call Contract Example

Relay a message from source-chain to destination-chain.

Deploy:

```bash
node scripts/deploy examples/call-contract [local|testnet]
```

Run the test:

```bash
node scripts/test examples/call-contract [local|testnet] ${srcChain} ${destChain} ${'message'}
```

**Default Values**:

-   `srcChain` is `Avalanche`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `destChain` is `Fantom`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `message` is `Hello World`

## Example

```bash
node scripts/deploy examples/call-contract local
node scripts/test examples/call-contract local "Moonbeam" "Avalanche" 'Hello World'
```

Output:

```
--- Initially ---
value at Avalanche is
--- After ---
value at Avalanche is Hello World
```
