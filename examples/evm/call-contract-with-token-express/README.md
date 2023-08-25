# Call Contract with Token (Express)

This guide demonstrates how to send aUSDC from a source chain to a destination chain, distributing it equally among specified accounts. The distinction between this and the [Call Contract with Token](../call-contract-with-token/README.md) example is that this approach utilizes the express mechanism.

### Deployment

To deploy the contract, run the following command:

```bash
npm run deploy evm/call-contract-with-token-express
```

**Note:** On the testnet, we use a whitelisting system. If you're running this example on the testnet, you can skip the deployment. The execution step will automatically select the whitelisted express contract for you.

### Execution

To execute the example, use the following command:

```bash
npm run execute evm/call-contract-with-token-express  [local|testnet] ${srcChain} ${destChain} ${amount} ${account} ${account2} ...
```

**Note**
The GMP Express feature is already lived on our testnet. However, the following conditions need to be met:

-   The contract address must be whitelisted by our executor service.

Currently, our whitelisted contract addresses for this example are:

-   Avalanche: `0x22a214c3c2C23a370414e2A4b2CF829A76c29A1b`
-   Polygon: `0x22a214c3c2C23a370414e2A4b2CF829A76c29A1b`

The script will automatically select above whitelisted express contracts for you when running script against testnet.

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
