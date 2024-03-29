# Call Contract with Valued Express


### Deployment

To deploy the contract, run the following command:

```bash
npm run deploy evm/call-contract-with-valued-express [local|testnet]
```

The aforementioned command pertains to specifying the intended environment for a project to execute on. It provides the option to choose between local and testnet environments by appending either `local` or `testnet` after the command. 

An example of its usage is demonstrated as follows: `npm run deploy evm/call-contract-with-valued-express local` or `npm run deploy evm/call-contract-with-valued-express testnet`. 

### Execution

To execute the example, use the following command:

```bash
npm run execute evm/call-contract-with-valued-express  [local|testnet] ${srcChain} ${destChain}
```

**Note**
The GMP Express feature is already lived on our testnet. However, the following conditions need to be met:

-   The contract address must be whitelisted by our executor service.
-   We only support `aUSDC` token and the amount must be less than 500 aUSDC.

Currently, our whitelisted contract addresses for this example are:

-   Avalanche: `0x4E3b6C3d284361Eb4fA9aDE5831eEfF85578b72c`
-   Polygon: `0xAb6dAb12aCCAe665A44E69d44bcfC6219A30Dd32`
