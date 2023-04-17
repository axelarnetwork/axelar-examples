# Axelar cross-chain dApp examples

## Introduction

Welcome to Axelar cross-chain dApp examples! This repository provides the code for several example dApps in the [Axelar Local Development Environment](https://github.com/axelarnetwork/axelar-local-dev). These examples contain both JavaScript and Solidity smart contract code that can be used as a starting point for building your own cross-chain dApps. This readme provides a detailed guide on how to set up the development environment and run the examples.

**Note:** Please be aware that some example folders in this repository are currently being documented. Our team is working diligently to provide comprehensive documentation for all examples to ensure that you have the best possible experience building with our tools.

### Table of Contents
- [Introduction](#introduction)
- [Getting Started](#getting-started)
  - [One-time setup](#one-time-setup)
  - [Set environment variables](#set-environment-variables)
  - [Print wallet balances](#print-wallet-balances)
  - [Running the local chains](#running-the-local-chains)
- [Examples](#examples)
  - [Evm Examples](#evm-examples)
    - [Basic](#basic)
    - [Advanced](#advanced)
  - [Aptos Examples](#aptos-examples)
  - [Web Examples](#web-examples)


## Introduction

[Axelar Network](https://axelar.network/) is the universal interoperability network that securely connects all blockchain ecosystems, applications, assets, and users. Axelar cross-chain dApp examples demonstrate how to build cross-chain applications using Axelar SDK. In this repository, we provide several examples of dApps that demonstrate how to use Axelar to build cross-chain dApps.

## Getting Started

To build cross-chain dApps using Axelar SDK, you must first set up your development environment. This section provides a detailed explanation on how to set up your development environment for running the examples.

## One-time setup

Before you can start running the examples, you need to install [Node.js](https://nodejs.org/en/download/). You can check your Node.js version by running `node -v`. We support Node.js version 16.x and 18.x.

Ensure you also have [python](https://www.python.org/) installed and configured on your machine. You can check your python version by running `python --version`. We support python version 3.8.x.

1. Clone this repo:

```bash
git clone https://github.com/axelarnetwork/axelar-examples.git
```

2. Install dependencies:

```bash
npm install
```

3. Compile smart contracts:

```bash
npm run build
```

## Set environment variables

You can get started quickly with a random local key and `.env` file by running

```bash
npm run setup
```

Or you can manually copy the example `.env.example` file and fill in your EVM private key. See the [example Metamask Instructions](https://metamask.zendesk.com/hc/en-us/articles/360015289632-How-to-export-an-account-s-private-key) for exporting your private keys.

```bash
cp .env.example .env
```

Then update to your own private key.

## Print wallet balances

To print your wallet balances for each chain, run:

```bash
npm run check-balance [local|testnet]
```

The aforementioned command pertains to specifying the intended environment for a project to execute on. It provides the option to choose between local and testnet environments by appending either `local` or `testnet` after the command. 

An example of its usage is demonstrated as follows: `npm run check-balance local` or `npm run check-balance testnet`. It is noteworthy that the script defaults to testnet if no environment is explicitly specified.

## Running the local chains

To start the local chains, run the following command:

```bash
npm run start
```
**Note:** Leave this node running on a separate terminal before deploying and testing the dApps.

## Examples

This repository contains several examples of dApps that you can use as a starting point for building your own cross-chain applications. Each example is located in a subdirectory under the `/examples` directory. The following sections describe each example in more detail.

- `evm`: This folder contains several basic and advanced examples of how to interact with Ethereum Virtual Machine (EVM) contracts.

- `aptos`: This folder contains examples of how to use `Aptos` module to enable cross-chain functionality.

- `web`: This folder contains examples of how to build web-based dApps that utilize cross-chain functionality.

### Evm Examples

The EVM (Ethereum Virtual Machine) examples demonstrate how to build and interact with smart contracts on the Ethereum network. The EVM examples include both basic and advanced examples.

#### Basic
The basic EVM examples demonstrate simple smart contracts and their interactions.

- [call-contract](examples/evm/call-contract/): This example demonstrates how to relay a message from a source-chain to a destination-chain.
- [call-contract-with-token](examples/evm/call-contract-with-token/): This example allows you to send aUSDC from a source chain to a destination chain and distribute it equally among specified accounts.
- [send-token](examples/evm/send-token/): This example sends a supported erc-20 token from source chain to the destination chain.
- [deposit-address](examples/evm/deposit-address/): This example demonstrates how to deposit tokens from one chain to another using a deposit address.

#### Advanced
The advanced EVM examples demonstrate more complex smart contracts and their interactions.

- [call-contract-with-token-express](examples/evm/call-contract-with-token-express/): This example allows you to send aUSDC from a source chain to a destination chain and distribute it equally among specified accounts using the GMP Express feature.
- [nft-linker](examples/evm//nft-linker/): This example sends the NFT that was originally minted at source-chain to destination-chain.
- [send-ack](examples/evm/send-ack/): This example demonstrates a two-way messaging to send a message from source-chain to destination-chain.
- [cross-chain-token](examples/evm/cross-chain-token/): This example demonstrates how to mint tokens on a source-chain and transfer them to a destination-chain.


### Aptos Examples

The Aptos examples demonstrate how to build and interact with smart contracts on the Cosmos network. The Aptos examples include both basic and advanced examples.

#### Basic

The basic Aptos examples demonstrate simple smart contracts and their interactions.

- [call-contract](examples/aptos/call-contract/): This example demonstrates how to relay a  bi-directional messages between Aptos and an EVM chain.

### Web Examples

The web examples demonstrate how to build web-based dApps that utilize cross-chain functionality. Conveniently, all of the examples have been packaged together, making it simple to set up and run them all in one place.

Check the [web examples README](examples-web/README.md) get started.

## Contributors

We appreciate your contribution to the growth of `Axelar Examples` project. Thank you for dedicating your time and effort towards building and improving our platform. Keep up the great work and happy hacking!🍻

[![Contributors](https://contrib.rocks/image?repo=axelarnetwork/axelar-examples)](https://github.com/axelarnetwork/axelar-examples/README.md)

## Stargazers

[![Stargazers](https://git-lister.onrender.com/api/stars/axelarnetwork/axelar-examples?limit=20)](https://github.com/axelarnetwork/axelar-examples)

[Go to top](#introduction)


