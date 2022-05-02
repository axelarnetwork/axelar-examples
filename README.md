# Axelar Local Dev Sample

This repo provides a basic usage of https://github.com/axelarnetwork/axelar-local-dev

## Preruiquisite

- Node version >= 16
- Rename `examples/secret.sample.json` to `examples/secret.json` and add your private key there.

## Install

1. Run `yarn`
2. Run `yarn build` to compile contracts in `axelar-local-dev`.
3. Run `yarn compile` to compile all contracts in `/examples`.
4. (Optional) If you want to run examples in your local machine, please run `yarn start-local` in another terminal window to spin 2 networks up.

## Send a token to another chain

This example will show you a way to send token from chain A to chain B.

Run `yarn send-token`

## Call contract

This example will show you how to call a smart contract that deployed at `chain B` from the `chain A`.

| Steps                     | Local command               | Testnet command                     |
| ------------------------- | --------------------------- | ----------------------------------- |
| **1. Deploying contract** | `yarn deploy-call-contract` | `yarn deploy-call-contract testnet` |
| **2. Run example**        | `yarn call-contract`        | `yarn call-contract testnet`        |

## Call contract with token

This example will show you how to send a token along with arbitrary payload to `chain B` from the `chain A`.

| Steps                     | Local command                          | Testnet command                                |
| ------------------------- | -------------------------------------- | ---------------------------------------------- |
| **1. Deploying contract** | `yarn deploy-call-contract-with-token` | `yarn deploy-call-contract-with-token testnet` |
| **2. Run example**        | `yarn call-contract-with-token`        | `yarn call-contract-with-token testnet`        |
