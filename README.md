# Axelar Local Dev Sample

This repo provides a basic usage of https://github.com/axelarnetwork/axelar-local-dev

## Preruiquisite

Node version >= 16

## Install

Run `npm i`

## Run Examples

### Send token

This example will show you a way to send token from chain A to chain B.

1. Run `npm run send-token`

### Call contract with token

This example will show you how to call a smart contract that deployed at `chain B` from the `chain A`.

1. Run `npm run compile` to compile the contract that we used for the example.
2. Run `npm run call-contract-with-token`
