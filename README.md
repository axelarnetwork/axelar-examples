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

Each example has several arguments as described below:

| Variable                                  | Valid Values                                       | Default                                                                                    | Example                                    | Notes                                                   |
| ----------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------ | ------------------------------------------------------- |
| network                                   | local, testnet                                     | no default                                                                                 | local                                      |                                                         |
| source-chain                              | Moonbeam, Avalanche, Fantom, Ethereum, and Polygon | `Avalanche`                                                                                | "Moonbeam" or 'Moonbeam'                   | case-sensitive                                          |
| destination-chain                         | Moonbeam, Avalanche, Fantom, Ethereum, and Polygon | `Fantom`                                                                                   | "Avalanche" or 'Avalanche'                 | case-sensitive                                          |
| message for call-contract                 | any string                                         | `Hello ${destination.name} from ${source.name}, it is ${new Date().toLocaleTimeString()}.` | 'Hello World'                              |                                                         |
| message for nonced-execution and send-ack | any string                                         | `Hello, the time is ${time}.`                                                              | 'Hello World'                              |                                                         |
| amount                                    | integer or float                                   | `10`                                                                                       | 53                                         | Any non-integer is rounded down to the nearest integer. |
| account                                   | any wallet address                                 | no default                                                                                 | 0xBa86A5719722B02a5D5e388999C25f3333c7A9fb | case-sensitive.                                         |

Run the deploy and test code specific to each example described below.

To use defaults, substitute `${}` for any or all of the variables.

### EVM Examples

#### Simple

-   [call-contract](/examples/evm/call-contract)
-   [call-contract-with-token](/examples/evm/call-contract-with-token)
-   [send-token](/examples/send-token)
-   [deposit-address](/examples/deposit-address)

#### Advances

-   [forecall](/examples/evm/advances/forecall)
-   [headers](/examples/evm/advances/headers)
-   [deposit-address](/examples/evm/advances/deposit-address)
-   [nft-linker](/examples/evm/advances/nft-linker)
-   [nft-auctionhouse](/examples/evm/advances/nft-auctionhouse)
-   [nonced-execution](/examples/evm/advances/nonced-execution)
-   [send-ack](/examples/evm/advances/send-ack)
-   [cross-chain-token](/examples/evm/advances/cross-chain-token)
-   [cross-chain-lending](/examples/evm/advances/cross-chain-lending)

### Aptos

You can build the aptos modules with

```bash
npm run build-aptos
```

Add more paths into `build-aptos.sh` if you are writing your own examples.

The two existing aptos examples (`aptos-hello-world` and `aptos-token-linker`) can be run like any other example, as long as you have a local aptos testnet running on `http://localhost:8080` with a faucet on `http://localhost:8081` _before_ running `createLocal`.
