# Call Contract

This example demonstrates how to deploy a smart contract and facilitate communication between an EVM chain and a Cosmos chain using Axelar.

## Prerequisite

-   Docker running on your local machine.

## Build a Contract (Optional)

1. A precompiled version of the contract is available [here](../cosmos/call-contract/wasm-contract/artifacts/send_receive.wasm). If you wish to modify the contract, follow these steps to recompile it:

```
npm run build-wasm
```

2. Upon successful compilation, the wasm file will be available at [this location](./wasm-contract/artifacts/send_receive.wasm).
   Note: This wasm file is necessary for deploying the contract on the wasm chain as part of this example.

## Deploying the Contract

To deploy the contract to the wasm chain and evm chains, execute the following command:

```
npm run deploy cosmos/call-contract local
```

## Execute example

To run the example and see the contract in action, use the following command:

```
npm run execute cosmos/call-contract local
```
