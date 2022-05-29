# Axelar cross-chain dApp examples

## Introduction

This repo provides the code for several example dApps in the [Axelar Local Development Environment](https://github.com/axelarnetwork/axelar-local-dev). It contains both the JavaScript and the smart contract code (.sol files) for each example. To try them out:

- Set up your system.
- Deploy and test the dApps.

Note: You may see example folders in this repo that are not described below. They are either placeholders for future dApps, such as the `temp` folder, or they are dApps in progress and we'll add a description when they're finished.

## Prerequisites

### One-time setup

1. You'll need to have node.js installed to run network dApps. To make sure you have it installed, run `node -v`. If no version is returned, see [Nodejs.org/downloads](https://nodejs.org/en/download/).

2. Clone the repo with `git clone https://github.com/axelarnetwork/axelar-local-gmp-examples.git`.

### Whenever you start a new work session

1. cd to `axelar-local-gmp-examples`.

2. Build contracts and tests (The update and install takes a few minutes.):
   ```
   npm update && npm install
   npm run build
   ```

3. To connect to the axelar network, run `npm install axelarnetwork/axelar-local-dev`.

4. To run a local node, cd to `axelar-local-gmp-examples` in a separate terminal and run `node scripts/createLocal`. You’ll need to have this node running to deploy the dApps.

5. To make sure that the address we use for examples is funded on all five supported testnets, run `node scripts/checkBalances`. We use `0xBa86A5719722B02a5D5e388999C25f3333c7A9fb` to deploy and test all examples. Alternatively, you can use `--address [<address>]` to specify a different address.

## Deploy and test each example

1. Each example has several variables. Enter a valid value in the format of the example.

| Variable| Valid Values| Default?| Example| Notes|
--- | --- | ---| ---| ---|
|network|local, testnet|none:remove this column?|local|
|source-chain|Moonbeam, Avalanche, Fantom, Ethereum, and Polygon|none?|"Moonbeam" or 'Moonbeam'| case-sensitive|
|destination-chain|Moonbeam, Avalanche, Fantom, Ethereum, and Polygon (case-sensitive)|none?|"Avalanche" or 'Avalanche'| case-sensitive|
|message|any string|?|"Hello World!" or 'Hello World!'| |
|amount|any whole number? take decimals?|none?|53| in aUSDC? exchange?|
|account|any wallet address?|none?|0xBa86A5719722B02a5D5e388999C25f3333c7A9fb | case-sensitive string (need quotation marks)?|

2. Run the deploy and test code.

### Call contract

This dApp relays a message from source-chain to destination-chain.

1. To deploy the dApp, run:

`node scripts/deploy examples/call-contract [<local|testnet>]`

2. To test it, run:

`node scripts/test examples/call-contract [<local|testnet>] [<source-chain>] [<destination-chain>] [<message>]`

Example:
`node scripts/test examples/call-contract local "Moonbeam" "Avalanche" "Hello World!"`

Result:
```
--- Initially ---
value at Avalanche is
--- After ---
value at Avalanche is Hello World!
```

3. To share your code cross-chain, run `yarn call-contract`.

### Call contract with token

This dApp sends aUSDC from source-chain to destination-chain and distributes it equally among all accounts specified.

1. To deploy the dApp, run:

`node scripts/deploy examples/call-contract-with-token [<local|testnet>]`

2. To test it, run:

`node scripts/test examples/call-contract-with-token [<local|testnet>] [<source-chain>] [<destination-chain>] [<amount>] [<account>] [<account2>]...`

### Cross chain token

This dApp mints some token at source-chain and has it sent to destination-chain.

1. To deploy the dApp, run:

`node scripts/deploy examples/cross-chain-token [<local|testnet>]`

2. To test it, run:

`node scripts/test examples/cross-chain-token [<local|testnet>] [<source-chain>] [<destination-chain>] [<amount>]`

### Deposit address

This dApp sends aUSDC from source-chain to destination-chain. Run it on testnet. To test it:

1. Fund `0xBa86A5719722B02a5D5e388999C25f3333c7A9fb` with aUSDC.

2. Run:

`node scripts/test examples/deposit-address [<testnet>] [<source-chain>] [<destination-chain>] [<amount>]`

Deposit-address is a simple send transaction. There is no smart contract to deploy.

### Headers

This dApp informs destination-chain of the last header of source-chain.

1. To deploy the dApp, run:

`node scripts/deploy examples/headers [<local|testnet>]`

2. To test it, run:

`node scripts/test examples/headers [<local|testnet>] [<source-chain>] [<destination-chain>]`

### NFT linker

This dApp sends the NFT that was originally minted at source-chain to destination-chain.

1. To deploy the dApp, run:

`node scripts/deploy examples/nft-linker [<local|testnet>]`

A single NFT is minted to the deployer (`0xBa86A5719722B02a5D5e388999C25f3333c7A9fb`) on each chain.

2. To test it, run:

`node scripts/test examples/nft-linker [<local|testnet>] [<source-chain>] [<destination-chain>]`

You cannot send a duplicate NFT to a chain. The dApp fails when the NFT is already at the destination-chain.

### Nonced execution

This dApp sends a message from source-chain to destination-chain.

1. To deploy the dApp, run:

`node scripts/deploy examples/nonced-execution [<local|testnet>]`

2. To test it, run:

`node scripts/test examples/nonced-execution [<local|testnet>] [<source-chain>] [<destination-chain>] [<message>]`

### Send ack

This dApp sends a message from source-chain to destination-chain.

1. To deploy the dApp, run:

`node scripts/deploy examples/send-ack [<local|testnet>]`

2. To test it, run:

`node scripts/test examples/send-ack [<local|testnet>] [<source-chain>] [<destination-chain>] [<message>]`

### Send token

This dApp sends aUSDC from the source to the destination. Run it on testnet. To test it:

1. Fund `0xBa86A5719722B02a5D5e388999C25f3333c7A9fb` with aUSDC.

2. Run:

`node scripts/test examples/send-token [<testnet>] [<source-chain>] [<destination-chain>] [<amount>]`

Send-token is a simple send transaction. There is no smart contract to deploy.
