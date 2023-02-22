# Deposit Address

This test demonstrates how to deposit tokens from one chain to another using a deposit address.

### Prerequisite

Make sure you've already followed the following steps:

-   [Setup environment variables](/README.md#set-environment-variables)
-   [Run the local chains](/README.md#running-the-local-chains)

### Execution

To execute the example, use the following command:

```bash
npm run execute evm/deposit-address [local|testnet] ${srcChain} ${destChain} ${amount}
```

**Default Values**:

-   `srcChain` is `Avalanche`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `destChain` is `Fantom`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `amount` is `10e6`

### Note

-   If running on testnet, ensure that `0xBa86A5719722B02a5D5e388999C25f3333c7A9fb` is funded with aUSDC. This address is used to deploy and test all examples and is funded by default in the local environment when you run start. To make sure that it's funded on all five supported testnets, run `node/printBalances`.

## Example

```bash
npm run execute evm/deposit-address local
```

The output will be:

```
--- Initially ---
Balance at Avalanche is 100000000
Balance at Fantom is 100000000
0xb54eA64537F3307907E06d3B93ccd4A3E711623f
--- After ---
Balance at Avalanche is 90000000
Balance at Fantom is 109000000
```

This example demonstrates how to deposit 10e6 tokens from Avalanche chain to Fantom chain using a deposit address. The initial balance of the Avalanche chain and Fantom chain is `100000000`. After the execution, the balance of Avalanche chain is `90000000` and the balance of Fantom chain is `109000000`. The deposit address is `0xb54eA64537F3307907E06d3B93ccd4A3E711623f`.
