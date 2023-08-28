# Call Contract

Relay a message bi-directional between MultiversX and an EVM chain.

Deploy:

```bash
npm run deploy multiversx/call-contract local
```

Run the test:

```bash
npm run execute multiversx/call-contract local ${evmChain} ${message}
```

**Default Values**:

-   `evmChain` is `Avalanche`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `message` is `Hello World`

## Example

```bash
npm run deploy multiversx/call-contract local
npm run execute multiversx/call-contract local "Avalanche" 'Hello World'
```

Output:

```
--- Initially ---
value at Avalanche is ""
value at MultiversX is "Hello MultiversX from Ethereum, it is 1:26:06 PM."
--- After ---
value at Avalanche is "Hello Avalanche from MultiversX, it is 7:05:48 PM."
value at MultiversX is "Hello MultiversX from Avalanche, it is 7:05:48 PM."
```
