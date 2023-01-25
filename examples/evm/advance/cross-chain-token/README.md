### Cross-chain token

Mints some token at source-chain and send it to destination-chain.

Deploy:

```bash
node scripts/deploy examples/cross-chain-token [local|testnet]
```

Run the test:

```bash
node scripts/test examples/cross-chain-token [local|testnet] ${srcChain} ${destChain} ${amount}
```

**Default Values**:

-   `srcChain` is `Avalanche`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `destChain` is `Fantom`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `amount` is `10`

#### Example

```bash
node scripts/deploy examples/cross-chain-token local
node scripts/test examples/cross-chain-token local "Ethereum" "Fantom" 1
```

Output:

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
