# Call Contract

This examples demonstrates on how you deploy a smart contract and sending message between evm chain and cosmos chain with Axelar.

## Build a Contract

```
cd wasm-contract
docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/code/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/rust-optimizer:0.12.13
```

Once completed, you should see the `wasm-contract/artifacts/send_receive.wasm` file.

We will use this file to deploy to the wasm chain for this example.

## Deploy a Contract

