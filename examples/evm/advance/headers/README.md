### Headers

Informs destination-chain of the last header of source-chain.

Deploy:

```bash
node scripts/deploy examples/headers [local|testnet]
```

Run the test:

```bash
node scripts/test examples/headers [local|testnet] ${srcChain} ${destChain}
```

**Default Values**:

-   `srcChain` is `Avalanche`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `destChain` is `Fantom`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon

#### Example

```bash
node scripts/deploy examples/headers local
node scripts/test examples/headers local "Fantom" "Moonbeam"
```

Output:

```
Success!
```
