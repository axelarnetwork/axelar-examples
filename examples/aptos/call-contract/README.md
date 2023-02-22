# Call Contract

Relay a message from source-chain to destination-chain.

Deploy:

```bash
npm run deploy aptos/call-contract [local|testnet]
```

Run the test:

```bash
npm run execute aptos/call-contract [local|testnet] ${srcChain} ${destChain} ${message}
```

**Default Values**:

-   `srcChain` is `Avalanche`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `destChain` is `Fantom`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `message` is `Hello World`

## Example

```bash
npm run deploy aptos/call-contract local
npm run execute aptos/call-contract local "Aptos" "Avalanche" 'Hello World'
```

Output:

```
--- Initially ---
value at Avalanche is
--- After ---
value at Avalanche is Hello Avalanche from aptos, it is 6:29:55 PM.
```
