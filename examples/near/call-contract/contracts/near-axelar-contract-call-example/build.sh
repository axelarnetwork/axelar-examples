#!/bin/sh

echo ">> Building contract"

rustup target add wasm32-unknown-unknown
cargo build --all --target wasm32-unknown-unknown --release && cp ./target/wasm32-unknown-unknown/release/near_axelar_contract_call_example.wasm ../near_axelar_contract_call_example.wasm
