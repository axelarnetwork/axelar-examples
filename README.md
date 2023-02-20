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

```bash
cp .env.example .env
```

Then update to your own private key.

## Deploy and test each example

In order to run the examples against the local emulator, cd to `axelar-examples` and run

```bash
node scripts/start
```

Leave this node running on a separate terminal before deploying and testing the dApps.

# Examples

-   [Evm Examples](/examples/evm/)
-   [Aptos Examples](/examples/aptos/)
