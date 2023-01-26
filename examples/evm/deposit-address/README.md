### Deposit address

Run the `deposit-address` test:

> Note: If running on `testnet` then ensure that `0xBa86A5719722B02a5D5e388999C25f3333c7A9fb` is funded with aUSDC.
> We use `0xBa86A5719722B02a5D5e388999C25f3333c7A9fb` to deploy and test all examples. It's funded by default in the `local` environment when you run `start`. To make sure that it's funded on all five supported testnets, run `node/printBalances`.

```bash
npm run execute evm/deposit-address [local|testnet] ${srcChain} ${destChain} ${amount}
```

**Default Values**:

-   `srcChain` is `Avalanche`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `destChain` is `Fantom`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `amount` is `10`

#### Example

```bash
npm run execute evm/deposit-address local
```

Output:

```
--- Initially ---
Balance at Avalanche is 100000000
Balance at Fantom is 100000000
0xb54eA64537F3307907E06d3B93ccd4A3E711623f
--- After ---
Balance at Avalanche is 90000000
Balance at Fantom is 109000000
```
