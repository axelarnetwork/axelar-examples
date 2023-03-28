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
value at Avalanche is ""
value at Aptos is "Hello Aptos from Ethereum, it is 1:26:06 PM."
--- After ---
value at Avalanche is "Hello Avalanche from Aptos, it is 7:05:48 PM."
value at Aptos is "Hello Aptos from Avalanche, it is 7:05:48 PM."
```
