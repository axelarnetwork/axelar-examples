# Send Token

Send a supported erc-20 token from source chain to the destination chain.

Run the `send-token` test:

```bash
node scripts/test examples/send-token [local|testnet] ${srcChain} ${destChain} ${amount}
```

**Default Values**:

-   `srcChain` is `Avalanche`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `destChain` is `Fantom`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `amount` is `10`

> Note: No smart contract to deploy for these examples.
>
> If running on `testnet` then ensure that `0xBa86A5719722B02a5D5e388999C25f3333c7A9fb` is funded with aUSDC.
>
> We use `0xBa86A5719722B02a5D5e388999C25f3333c7A9fb` to deploy and test all examples. It's funded by default in the `local` environment when you run `createLocal`. To make sure that it's funded on all five supported testnets, run `node/printBalances`.

## Example

```bash
node scripts/test examples/send-token local
```

Output:

```
--- Initially ---
Balance of 0xBa86A5719722B02a5D5e388999C25f3333c7A9fb at Avalanche is 90000000
Balance of 0xBa86A5719722B02a5D5e388999C25f3333c7A9fb at Fantom is 109000000
--- After ---
Balance of 0xBa86A5719722B02a5D5e388999C25f3333c7A9fb at Avalanche is 80000000
Balance of 0xBa86A5719722B02a5D5e388999C25f3333c7A9fb at Fantom is 118000000
```
