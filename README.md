# Axelar cross-chain dApp examples

## Introduction

This repo provides the code for several example dApps in the [Axelar Local Development Environment](https://github.com/axelarnetwork/axelar-local-dev). Examples contain both JavaScript and Solidity smart contract code.

**Note:** Some example folders in this repo are not documented.

## ⚠️ Disclaimer — example code only

This code is provided for demonstration and learning purposes only.
The examples are intentionally minimal and deliberately omit production concerns for the sake of clarity.
In particular, many of the cross-chain receive handlers do **not** authenticate the source (`sourceChain` / `sourceAddress`) of incoming messages, and some contracts carry their own `Demo only` caveats in the code.
Do **not** deploy this code as-is, and do not fork it as a production template.
Before building anything on top of it, review it in full, add the safeguards appropriate to your use case, and obtain an independent security audit.

Roll out progressively: test your integration thoroughly on testnet first, and when you move to mainnet, start with small-value transfers before scaling up.

## One-time setup

### Prerequisites

-   **Node.js** — this repo targets the version pinned in [`.nvmrc`](.nvmrc).
    With [nvm](https://github.com/nvm-sh/nvm), run `nvm install && nvm use`; check with `node -v`.
-   **pnpm** — the package manager is pinned via the `packageManager` field in `package.json` and enabled through [Corepack](https://nodejs.org/api/corepack.html):

```bash
corepack enable
```

-   **Foundry** — the local chains run on [`anvil`](https://book.getfoundry.sh/anvil/), a standalone binary (not an npm dependency).
    Install it with [`foundryup`](https://book.getfoundry.sh/getting-started/installation) and check with `anvil --version`.

### Install

1. Clone this repo:

```bash
git clone https://github.com/axelarnetwork/axelar-examples.git
```

2. Navigate to `axelar-examples` and install dependencies:

```bash
pnpm install
```

3. Compile smart contracts:

```bash
pnpm run build
```

## Set environment variables

You can get started quickly with a random local key and `.env` file by running

```bash
pnpm run setup
```

Or you can manually copy the example `.env.example` file and fill in your EVM private key. See the [example Metamask Instructions](https://metamask.zendesk.com/hc/en-us/articles/360015289632-How-to-export-an-account-s-private-key) for exporting your private keys.

```bash
cp .env.example .env
```

Then update to your own private key.

## Running the local chains

```bash
pnpm run start
```

Leave this node running on a separate terminal before deploying and testing the dApps.

## Print wallet balances

This script will print your wallet balances for each chain.

```bash
pnpm run check-balance [local|testnet]
```

If not specified, this will print balances of the wallet for testnet.

## Examples

-   [Evm Examples](/examples/evm/)
-   [Cosmos Examples](/examples/cosmos/)
-   [MultiversX Examples](/examples/multiversx/)
-   [Web Examples](/examples-web/)
