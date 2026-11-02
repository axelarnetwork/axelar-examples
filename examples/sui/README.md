# Sui Examples

Cross-chain examples between Sui and the local EVM chains.

## Prerequisites

The `sui` CLI must be on `PATH`, at exactly the version `axelar-cgp-sui` pins in its `version.json`.
Publishing compiles through `sui move build`, and any other version fails during Move dependency resolution with an error that names an unrelated object id.
Install the pinned release from the [Sui releases page](https://github.com/MystenLabs/sui/releases); if you already have a different version, put the pinned one first on `PATH` rather than replacing it.

Set `sui.enabled` to `true` in `config/default.json`, and start a local Sui network in its own terminal:

```bash
sui start --with-faucet --force-regenesis
```

That resets local Sui network state under `~/.sui`.
The harness does not start it for you, the same way it expects `anvil` to be running for the EVM chains.

`SUI_URL` and `SUI_FAUCET_URL` in `.env` default to `http://127.0.0.1:9000` and `http://127.0.0.1:9123`.

## Examples

- [call-contract](./call-contract/) — send a string between an EVM chain and a Sui Move package.

## What differs on testnet

These examples run against a local Axelar deployment that publishes its own gateway and holds the signer keys, so the harness can sign proofs itself.
On testnet the gateway is Axelar's, the real verifier set signs, and amplifier relays.
The application code carries over; the harness does not.

Three things change when porting an example to testnet:

- `Move.toml` points at the published package addresses rather than locally staged sources.
- Gas must actually be paid. Locally the relayer delivers regardless of payment.
- Reading Sui state needs the current Sui data API. These examples use `SuiClient`'s JSON-RPC, which the local network serves but public fullnodes no longer do.
