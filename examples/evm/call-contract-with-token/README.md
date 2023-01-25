### Call contract with token

Send aUSDC from source-chain to destination-chain and distribute it equally among all accounts specified.

Deploy:

```bash
node scripts/deploy examples/call-contract-with-token [local|testnet]
```

Run the test:

```bash
node scripts/test examples/call-contract-with-token [local|testnet] ${"source-chain"} ${"destination-chain"} ${amount} ${account} ${account2} ...
```

#### Example

```bash
node scripts/deploy examples/call-contract-with-token local
node scripts/test examples/call-contract-with-token local "Moonbeam" "Ethereum" 100 0xBa86A5719722B02a5D5e388999C25f3333c7A9fb
```

Output:

```
--- Initially ---
0xBa86A5719722B02a5D5e388999C25f3333c7A9fb has 100 aUSDC
--- After ---
0xBa86A5719722B02a5D5e388999C25f3333c7A9fb has 199 aUSDC
```
