# Axelar Local Dev Sample

This repo provides a basic usage of https://github.com/axelarnetwork/axelar-local-dev

## Preruiquisite

Node version >= 16

## Install

1. Run `yarn
2. Run `yarn build` to compile contracts in `axelar-local-dev`.

## Send a token to another chain

This example will show you a way to send token from chain A to chain B.

1. Run `yarn send-token`

## Call a smart contract from the different chain

This example will show you how to call a smart contract that deployed at `chain B` from the `chain A`.

1. Run `yarn compile` to compile the contract that we used for the example.
2. Run `yarn call-contract-with-token`
