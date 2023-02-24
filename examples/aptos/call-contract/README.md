# Call Contract

Relay a message bi-directional between Aptos and an EVM chain.

Deploy:

```bash
npm run deploy aptos/call-contract local
```

Run the test:

```bash
npm run execute aptos/call-contract local ${evmChain} ${message}
```

**Default Values**:

-   `evmChain` is `Avalanche`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `message` is `Hello World`

## Example

```bash
npm run deploy aptos/call-contract local
npm run execute aptos/call-contract local "Avalanche" 'Hello World'
```

Output:

```
--- Initially ---
value at Avalanche is
--- After ---
value at Avalanche is Hello Avalanche from aptos, it is 6:29:55 PM.
```
