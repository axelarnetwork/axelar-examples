# Axelar cross-chain dApp examples

## Introduction

This repo provides the code for several example dApps in the [Axelar Local Development Environment](https://github.com/axelarnetwork/axelar-local-dev). Examples contain both JavaScript and Solidity smart contract code.

**Note:** Some example folders in this repo are not documented below.

## One-time setup

Install [nodejs](https://nodejs.org/en/download/). Run `node -v` to check your installation.

Support Node.js version 16.x and 18.x

Clone this repo:

```bash
git clone https://github.com/axelarnetwork/axelar-examples.git
```

## Set up deployer key
You can get started quickly with a random local key and `.env` file by running

```bash
# node scripts/createPrivateKey.js
npm run setup
```

Or you can manually copy the example `.env.example` file and fill in your EVM private key. See the [example Metamask Instructions](https://metamask.zendesk.com/hc/en-us/articles/360015289632-How-to-export-an-account-s-private-key) for exporting your private keys.

```bash
cp .env.example .env
```

## Deploy and test each example

In order to run the examples against the local emulator, cd to `axelar-examples` and run

```bash
node scripts/start
```

Leave this node running on a separate terminal before deploying and testing the dApps.

# Examples

-   [Evm Examples](/examples/evm/)
-   [Aptos Examples](/examples/aptos/)
