# Axelar cross-chain dApp examples

## Introduction

This repo provides the code for several example dApps in the [Axelar Local Development Environment](https://github.com/axelarnetwork/axelar-local-dev). It contains both the JavaScript and the smart contract code (.sol files) for each example. To try them out:

- Set up your system.
- Deploy and test the dApps.

Note: You may see example folders in this repo that are not described below. They are either for our use, such as the `temp` folder, or they are dApps in progress and we'll add a description when they're finished.

## Prerequisites

### One-time setup

1. You'll need to have node.js installed to run network dApps. To make sure you have it installed, run `node -v`. If no version is returned, see

  [Nodejs.org/downloads](https://nodejs.org/en/download/).

2. Clone the repo with:

 `git clone https://github.com/axelarnetwork/axelar-local-gmp-examples.git`.

 3. Build contracts and tests (The update and install take a few minutes.):
    ```
    npm update && npm install
    npm run build
    ```

### To start a new work session

1. To run a local node, cd to `axelar-local-gmp-examples`, and run `node scripts/createLocal`. Leave this node running on a separate terminal window or tab before deploying and testing the dApps.

We use `0xBa86A5719722B02a5D5e388999C25f3333c7A9fb` to deploy and test all examples. This address is funded by default when creating a local set of chains. To make sure that the address we use for examples is funded on all five supported testnets, run `node/printBalances`.

## Deploy and test each example

1. Each example has several variables. Enter a valid value in the format of the example.

| Variable| Valid Values| Default| Example| Notes|
--- | --- | ---| ---| ---|
|network|local, testnet|no default|local| |
|source-chain|Moonbeam, Avalanche, Fantom, Ethereum, and Polygon|`Avalanche`|"Moonbeam" or 'Moonbeam'| case-sensitive|
|destination-chain|Moonbeam, Avalanche, Fantom, Ethereum, and Polygon|`Fantom`|"Avalanche" or 'Avalanche'| case-sensitive|
|message for call-contract|any string|`Hello ${destination.name} from ${source.name}, it is ${new Date().toLocaleTimeString()}.`|'Hello World'| |
|message for nonced-execution and send-ack|any string|`Hello, the time is ${time}.`|'Hello World'| |
|amount|integer or float|`10`|53|Any non-integer is rounded down to the nearest integer.|
|account|any wallet address|no default|0xBa86A5719722B02a5D5e388999C25f3333c7A9fb| case-sensitive.|

2. Run the deploy and test code. To use defaults, substitute `${}` for any or all of the variables, except address. For address, use `${address}`.

### Call contract

This dApp relays a message from source-chain to destination-chain.

1. To deploy the dApp, run:

  `node scripts/deploy examples/call-contract [local|testnet]`

2. To test it, run:

  `node scripts/test examples/call-contract [local|testnet] "<source-chain>" "<destination-chain>" "<message>"`

#### Example

Run:

```
node scripts/deploy examples/call-contract local
node scripts/test examples/call-contract local "Moonbeam" "Avalanche" 'Hello World'
```

Result:

```
--- Initially ---›
value at Avalanche is
--- After ---
value at Avalanche is Hello World
```

### Call contract with token

This dApp sends aUSDC from source-chain to destination-chain and distributes it equally among all accounts specified.

1. To deploy the dApp, run:

  `node scripts/deploy examples/call-contract-with-token [local|testnet]`

2. To test it, run:

  `node scripts/test examples/call-contract-with-token [local|testnet] "<source-chain>" "<destination-chain>" <amount> <account> "<account2>"...`

#### Example

Run:

```
node scripts/deploy examples/call-contract-with-token local
node scripts/test examples/call-contract-with-token local "Moonbeam" "Ethereum" 1 0xBa86A5719722B02a5D5e388999C25f3333c7A9fb  0xAF2696E6bcAd891Cb3C17B63365Bd32Eda24c1aA
```

Result:

```
--- Initially ---
0xBa86A5719722B02a5D5e388999C25f3333c7A9fb has 100 aUSDC
0xAF2696E6bcAd891Cb3C17B63365Bd32Eda24c1aA has 0 aUSDC
```

### Cross chain token

This dApp mints some token at source-chain and has it sent to destination-chain.

1. To deploy the dApp, run:

  `node scripts/deploy examples/cross-chain-token [local|testnet]`

2. To test it, run:

  `node scripts/test examples/cross-chain-token [local|testnet] "<source-chain>" "<destination-chain>" <amount>`

#### Example

Run:

```
node scripts/deploy examples/cross-chain-token local
node scripts/test examples/cross-chain-token local "Ethereum" "Fantom" 1
```

Result:

```
--- Initially ---
Balance at Ethereum is 0
Balance at Fantom is 0
--- After getting some token on the source chain ---
Balance at Ethereum is 1
Balance at Fantom is 0
--- After ---
Balance at Ethereum is 0
Balance at Fantom is 1
```

### Deposit address

This dApp sends aUSDC from source-chain to destination-chain. Run it on testnet. To test it:

1. Fund `0xBa86A5719722B02a5D5e388999C25f3333c7A9fb` with aUSDC.

2. Run:

  `node scripts/test examples/deposit-address testnet "<source-chain>" "<destination-chain>" <amount>`

Deposit-address is only a send transaction. There is no smart contract to deploy.

#### Example

Run:

`node scripts/test examples/deposit-address testnet ${} ${} ${}`

Result:

`--- Initially ---
Balance at Avalanche is 0
Balance at Fantom is 0
`

### Headers

This dApp informs destination-chain of the last header of source-chain.

1. To deploy the dApp, run:

  `node scripts/deploy examples/headers [local|testnet]`

2. To test it, run:

  `node scripts/test examples/headers <local|testnet> "<source-chain>" "<destination-chain>"`

#### Example

Run:

```
node scripts/deploy examples/headers local
node scripts/test examples/headers local "Fantom" "Moonbeam"
```

Result:

```
Success!
```

### NFT linker

This dApp sends the NFT that was originally minted at source-chain to destination-chain.

1. To deploy the dApp, run:

  `node scripts/deploy examples/nft-linker [local|testnet]`

  A single NFT is minted to the deployer (`0xBa86A5719722B02a5D5e388999C25f3333c7A9fb`) on each chain.

2. To test it, run:

  `node scripts/test examples/nft-linker [local|testnet] "<source-chain>" "<destination-chain>"`

  It's not possible to send a duplicate NFT to a chain. The dApp fails when the NFT is already at the destination-chain.

#### Example

Run:

```
node scripts/deploy examples/nft-linker local
node scripts/test examples/nft-linker local "Avalanche" "Polygon"
```

Result:

```
--- Initially ---
Token that was originally minted at Moonbeam is at Moonbeam.
Token that was originally minted at Avalanche is at Avalanche.
Token that was originally minted at Fantom is at Fantom.
Token that was originally minted at Ethereum is at Ethereum.
Token that was originally minted at Polygon is at Polygon.
--- Then ---
Token that was originally minted at Moonbeam is at Moonbeam.
Token that was originally minted at Avalanche is at Polygon.
Token that was originally minted at Fantom is at Fantom.
Token that was originally minted at Ethereum is at Ethereum.
Token that was originally minted at Polygon is at Polygon.
```

### Nonced execution

This dApp sends a message from source-chain to destination-chain.

1. To deploy the dApp, run:

  `node scripts/deploy examples/nonced-execution [local|testnet]`

2. To test it, run:

  `node scripts/test examples/nonced-execution [local|testnet] "<source-chain>" "<destination-chain>" <message>`

#### Example

Run:

```
node scripts/deploy examples/nonced-execution local
node scripts/test examples/nonced-execution local "Polygon" "Ethereum" 0000
```

Result:

```
--- Initially ---
Last message sent from Polygon@0xBa86A5719722B02a5D5e388999C25f3333c7A9fb to Ethereum was "" with a nonce of -1.
--- After ---
Last message sent from Polygon@0xBa86A5719722B02a5D5e388999C25f3333c7A9fb to Ethereum was "0000" with a nonce of 0.
```

### Send ack

This dApp sends a message from source-chain to destination-chain.

1. To deploy the dApp, run:

  `node scripts/deploy examples/send-ack [local|testnet]`

2. To test it, run:

  `node scripts/test examples/send-ack [local|testnet] "<source-chain>" "<destination-chain>" "<message>"`

#### Example

Run:

```
node scripts/deploy examples/send-ack local
node scripts/test examples/send-ack local "Fantom" "Moonbeam" "Received"
```

Result:

```
--- Initially ---
SendAckReceiverImplementation at Moonbeam has 0 messages and the last one is "".
--- After ---
SendAckReceiverImplementation at Moonbeam has 1 messages and the last one is "Received".
```


### Send token

This dApp sends aUSDC from the source to the destination. Run it on testnet. To test it:

1. Fund `0xBa86A5719722B02a5D5e388999C25f3333c7A9fb` with aUSDC.

2. Run:

  `node scripts/test examples/send-token testnet "<source-chain>" "<destination-chain>" <amount>`

  Send-token is only a send transaction. There is no smart contract to deploy.

#### Example  

Run:

`node scripts/test examples/send-token testnet ${} ${} ${}`

Result:

```
--- Initially ---
Balance of 0xBa86A5719722B02a5D5e388999C25f3333c7A9fb at Avalanche is 0
Balance of 0xBa86A5719722B02a5D5e388999C25f3333c7A9fb at Fantom is 0
```
