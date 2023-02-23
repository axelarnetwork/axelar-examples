# Call contract with token

This example allows you to send aUSDC from a source chain to a destination chain and distribute it equally among specified accounts.

### Deployment

To deploy the contract, run the following command:

```bash
npm run deploy evm/call-contract-with-token-express [local|testnet]
```

### Execution

To execute the example, use the following command:

```bash
npm run execute evm/call-contract-with-token-express  [local|testnet] ${srcChain} ${destChain} ${amount} ${account} ${account2} ...
```

**Note**
The GMP Express feature is already lived on our testnet. However, the following conditions need to be met:

-   The contract address must be whitelisted by our executor service.
-   We only support `aUSDC` token and the amount must be less than 500 aUSDC.

Currently, our whitelisted contract addresses for this example are:

-   Avalanche: `0x4E3b6C3d284361Eb4fA9aDE5831eEfF85578b72c`
-   Polygon: `0xAb6dAb12aCCAe665A44E69d44bcfC6219A30Dd32`

### Parameters

-   `srcChain`: The blockchain network from which the aUSDC will be transferred. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon. Default value is Polygon
-   `destChain`: The blockchain network to which the aUSDC will be transferred. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon. Default value is Avalanche.
-   `amount`: The amount of aUSDC to be transferred and distributed among the specified accounts. Default value is 10.
-   `account`: The address of the first account to receive aUSDC.
-   `account2`: The address of the second account to receive aUSDC, and so on.

## Example

```bash
npm run deploy evm/call-contract-with-token-express local
npm run execute evm/call-contract-with-token-express local "Polygon" "Avalanche" 100 0xBa86A5719722B02a5D5e388999C25f3333c7A9fb
```

### Output:

```
--- Initially ---
0xBa86A5719722B02a5D5e388999C25f3333c7A9fb has 100 aUSDC
--- After ---
0xBa86A5719722B02a5D5e388999C25f3333c7A9fb has 199 aUSDC
```
