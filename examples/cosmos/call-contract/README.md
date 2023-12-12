# Call Contract

This examples demonstrates on how you deploy a smart contract and sending message between evm chain and cosmos chain with Axelar.

## Prerequisite

-   Docker running on your local machine.

## Build a Contract (Optional)

We've precompiled the contract [here](../cosmos/call-contract/wasm-contract/artifacts/send_receive.wasm), but if you'd like to modify some code, here's how you can recompile it:

```
npm run build-wasm
```

Once completed, you should see the [wasm](./wasm-contract/artifacts/send_receive.wasm) file.

We will use this file to deploy to the wasm chain for this example.

## Deploy a Contract

```
npm run deploy cosmos/call-contract local
```

## Execute example

```
npm run execute cosmos/call-contract local
```
