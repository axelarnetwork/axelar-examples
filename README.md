# Axelar Local Dev Sample

This repo provides a basic usage of https://github.com/axelarnetwork/axelar-local-dev

## Preruiquisite

- Node version >= 16
- Rename `examples/secret.sample.json` to `examples/secret.json` and add your private key there.

## Install

1. Run `yarn`
2. Run `yarn build` to compile contracts in `axelar-local-dev`.
3. Run `yarn compile` to compile all contracts in `/examples`.

## Send a token to another chain

This example will show you a way to send token from chain A to chain B.

Run `yarn send-token`

## Call contract

This example will show you how to call a smart contract that deployed at `chain B` from the `chain A`.

Run `yarn call-contract`

## Call contract with token

This example will show you how to send a token along with arbitrary payload to `chain B` from the `chain A`.

Run `yarn call-contract-with-token`
