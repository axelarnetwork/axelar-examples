# !/bin/bash

docker run --rm -v "$(pwd)/examples/cosmos/call-contract/wasm-contract":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/code/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/rust-optimizer:0.12.13
