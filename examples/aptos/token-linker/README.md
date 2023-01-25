# Token Linker

Status: WIP

Deploy:

```bash
npm run deploy aptos/token-linker [local|testnet]
```

Run the test:

```bash
npm run execute aptos/token-linker [local|testnet] ${destChain} ${amount1} ${amount2}
```

**Default Values**:

-   `destChain` is `Avalanche`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `amount1` is `1e18`
-   `amount2` is `5e17/256**ignoreDigits`

## Example

```bash
npm run deploy aptos/token-linker local
npm run execute aptos/token-linker local "Avalanche" 10000000000 5000000000
```

Output:

```
--- Initially ---
value at Avalanche is
--- After ---
value at Avalanche is Hello World
```
