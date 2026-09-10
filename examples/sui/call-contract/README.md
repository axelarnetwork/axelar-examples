# Call Contract between EVM and Sui

Sends a string in both directions between an EVM chain and a Sui Move package.

Follow the [Sui prerequisites](../README.md#prerequisites) first: the pinned `sui` CLI, `sui.enabled` set to `true`, and a local Sui network running.

## Deploy

```bash
npm run deploy sui/call-contract local
```

This publishes the `hello_world` Move package against the already-published Axelar framework and registers its relayer-discovery transaction.
Skipping that registration would leave inbound messages undeliverable with no error reported anywhere.

## Run

```bash
npm run execute sui/call-contract local [evm-chain] [message-to-sui] [message-to-evm]
```

**Default Values**

- `evm-chain` — Avalanche
- `message-to-sui` — `Hello Sui from <chain>, it is <time>.`
- `message-to-evm` — `Hello <chain> from Sui, it is <time>.`

## Example

```bash
npm run execute sui/call-contract local Avalanche "hi sui" "hi avalanche"
```

Output:

```
--- Initially ---
Value at Avalanche is ""
Value at Sui is ""
--- After ---
Value at Avalanche is "hi avalanche"
Value at Sui is "hi sui"
```

## Addressing

The destination address for a message into Sui is the receiving package's **Channel object address**, not its package id.
The Sui gateway routes an approved message to a Channel, and the relayer then asks relayer discovery how to consume it from there.
`deployOnAltChain` records the channel address in `chain-config/local-sui.json`.

The destination chain name must be lowercase `sui`: the relayer matches on that literal.
