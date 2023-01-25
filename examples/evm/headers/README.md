### Headers

Informs destination-chain of the last header of source-chain.

Deploy:

```bash
npm run deploy evm/headers [local|testnet]
```

Run the test:

```bash
npm run execute evm/headers [local|testnet] ${srcChain} ${destChain}
```

**Default Values**:

-   `srcChain` is `Avalanche`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `destChain` is `Fantom`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon

#### Example

```bash
npm run deploy evm/headers local
npm run execute evm/headers local "Fantom" "Moonbeam"
```

Output:

```
Success!
```
