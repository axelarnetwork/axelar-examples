# Axelar cross-chain dApp examples

## Introduction

This repo provides the code for several example dApps in the [Axelar Local Development Environment](https://github.com/axelarnetwork/axelar-local-dev). Examples contain both JavaScript and Solidity smart contract code.

**Note:** Some example folders in this repo are not documented below.

## One-time setup

Install [nodejs](https://nodejs.org/en/download/). Run `node -v` to check your installation.

Version 16 is required. If needed you can switch your node version (or lower, if you are on a higher version) via

```bash
sudo npm i -g n
sudo n v16.15.0
```

Clone this repo:

```bash
git clone https://github.com/axelarnetwork/axelar-local-gmp-examples.git
```

Build contracts and tests:

```bash
npm ci
npm run build
```

## Set up deployer key

```bash
cp .env.example .env
```

Then update to your own private key.

## Deploy and test each example

In order to run the examples against the local emulator, cd to `axelar-local-gmp-examples` and run

```bash
node scripts/createLocal
```

Leave this node running on a separate terminal before deploying and testing the dApps.

### EVM Examples

#### Basic

-   [call-contract](/examples/evm/call-contract)
-   [call-contract-with-token](/examples/evm/call-contract-with-token)
-   [send-token](/examples/send-token)
-   [deposit-address](/examples/deposit-address)

#### Advance

-   [forecall](/examples/evm/advance/forecall)
-   [headers](/examples/evm/advance/headers)
-   [deposit-address](/examples/evm/advance/deposit-address)
-   [nft-linker](/examples/evm/advance/nft-linker)
-   [nft-auctionhouse](/examples/evm/advance/nft-auctionhouse)
-   [nonced-execution](/examples/evm/advance/nonced-execution)
-   [send-ack](/examples/evm/advance/send-ack)
-   [cross-chain-token](/examples/evm/advance/cross-chain-token)
-   [cross-chain-lending](/examples/evm/advance/cross-chain-lending)

### Aptos Examples

You can build the aptos modules with

```bash
npm run build-aptos
```

#### Basic

-   [call-contract](/examples/aptos/call-contract/)
-   [token-linker](/examples/aptos/token-linker/)

#### Advance

Add more paths into `build-aptos.sh` if you are writing your own examples.

The two existing aptos examples (`aptos-hello-world` and `aptos-token-linker`) can be run like any other example, as long as you have a local aptos testnet running on `http://localhost:8080` with a faucet on `http://localhost:8081` _before_ running `createLocal`.
