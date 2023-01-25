### Headers

Informs destination-chain of the last header of source-chain.

Deploy:

```bash
node scripts/deploy examples/headers [local|testnet]
```

Run the test:

```bash
node scripts/test examples/headers [local|testnet] ${"source-chain"} ${"destination-chain"}
```

#### Example

```bash
node scripts/deploy examples/headers local
node scripts/test examples/headers local "Fantom" "Moonbeam"
```

Output:

```
Success!
```
