# Axelar cross-chain dapp examples

## Introduction

This repo provides the code for several example dapps in the [Axelar Local Development Environment](https://github.com/axelarnetwork/axelar-local-dev). It contains both the JavaScript and the smart contract code (.sol files) for each example. To try them out:

- Set up your system.
- Deploy and test the apps.

Note: You may see example folders in this repo that are not described below. They are either placeholders for future apps, such as the `temp` folder, or they are dapps in progress and we'll add a description when they're finished.

## Setup

1. You'll need to have node.js installed to run network dapps. To make sure you have it installed, run `node -v`. If no version is returned, run
`npm update && npm install`.

2. Clone the repo with `git clone https://github.com/axelarnetwork/axelar-local-gmp-examples.git` and `cd axelar-local-gmp-examples`. 

\[Editor: Admittedly, the above could get old if it was repeated ad infinitum, but maybe it could be stated somewhere early in the doc.]

3. To connect to the axelar network, run `npm install axelarnetwork/axelar-local-dev`.

4. To make sure all contracts are compiled, run `npm run build`.

5. To run a local node, open a separate terminal and run `node scripts/createLocal`. You’ll need to have this node running to deploy the dapps.

   The five supported networks are deployed: Moonbeam (ChainID: 2500), Avalanche (chainID: 2501), Fantom (chainID: 2502), Ethereum (chainID: 2503),
   and Polygon (chainID: 2504) on port 8500. 

6. To make sure that the address we use for examples is funded on all five supported testnets, run `node/printBalances`. We use `0xBa86A5719722B02a5D5e388999C25f3333c7A9fb` to deploy and test all examples. Alternatively, you can use `--address [<address>]` to specify another address.

\[Editor: Suspicious syntax. Do you mean `node scripts/checkBalances`? If not, what? Is this shorthand for a commonly used longer command? I tried `node/printBalances` (Error: "No such file or directory"), `node printBalances` (Error: "Module not found"), `node scripts/checkBalances --address 0xBa86A5719722B02a5D5e388999C25f3333c7A9fb` (Error: "Could not detect network"...even though "serving 5 networks on port 8500....on separate terminal window...I saved images).]

## Deploy and test each example

For each example, enter:

- `local` or `testnet` for both the test and the deploy steps, except for deposit-address and send-token, which run on testnet.

- `source-chain` and `destination-chain` 

\[Editor: What's the correct way to identify each? by chain-ID? as a "string" or integer?]

- variables such as `message`, `amount`, and `account` 

\[Editor: What is the expected syntax and data type: message: "message"?, amount: integers?, account: "string"? integers? What are the defaults for each?]

\[Editor: In regard to this phrase: "All params are optional and have default values and can be ommited." How can you relay a message without a message, source, or destination? These must be required. I think the writer means it in the sense that it's optional for the user to enter a value bc there are defaults. In API, the convention is to call variables with default values "required". Please confirm and I'll find a way to reword this.]

and run the test and deploy.

### Call contract

This dapp relays a message from source-chain to destination-chain.

1. To deploy the dapp, run::

`node scripts/deploy examples/call-contract [<local|testnet>]`

2. To test it, run:

`node scripts/test examples/call-contract [<local|testnet>] [<source-chain>] [<destination-chain>] [<message>]`

3. To share your code cross-chain, run `yarn call-contract`. 

\[Editor: Is that the right characterizzation of what `yarn` is doing? If not, what is it doing and why don't we need one for any of the others? End of questions.]

### Call contract with token

This dapp sends aUSDC from source-chain to destination-chain and distributes it equally among all accounts specified.

1. To deploy the dapp, run:

`node scripts/deploy examples/call-contract-with-token [<local|testnet>]`

2. To test it, run:

`node scripts/test examples/call-contract-with-token [<local|testnet>] [<source-chain>] [<destination-chain>] [<amount>] [<account>] [<account2>]...`

### Cross chain token

This dapp mints some token at source-chain and has it sent to destination-chain.

1. To deploy the dapp, run:

`node scripts/deploy examples/cross-chain-token [<local|testnet>]`

2. To test it, run:

`node scripts/test examples/cross-chain-token [<local|testnet>] [<source-chain>] [<destination-chain>] [<amount>]`

### Deposit address

This dapp sends aUSDC from source-chain to destination-chain. Run it on testnet. To test it:

1. Fund `0xBa86A5719722B02a5D5e388999C25f3333c7A9fb` with aUSDC.

2. Run:

`node scripts/test examples/deposit-address [<testnet>] [<source-chain>] [<destination-chain>] [<amount>]`

Deposit-address is a simple send transaction. There is no smart contract to deploy.

### Headers

This dapp informs destination-chain of the last header of source-chain.

1. To deploy the dapp, run:

`node scripts/deploy examples/headers [<local|testnet>]`

2. To test it, run:

`node scripts/test examples/headers [<local|testnet>] [<source-chain>] [<destination-chain>]`

### NFT linker

This dapp sends the NFT that was originally minted at source-chain to destination-chain.

1. To deploy the dapp, run:

`node scripts/deploy examples/nft-linker [<local|testnet>]`

A single NFT is minted to the deployer (`0xBa86A5719722B02a5D5e388999C25f3333c7A9fb`) on each chain.

2. To test it, run:

`node scripts/test examples/nft-linker [<local|testnet>] [<source-chain>] [<destination-chain>]`

You cannot send a duplicate NFT to a chain. The dapp fails when the NFT is already at the destination-chain.

### Nonced execution

This dapp sends a message from source-chain to destination-chain.

1. To deploy the dapp, run:

`node scripts/deploy examples/nonced-execution [<local|testnet>]`
 
2. To test it, run: 

`node scripts/test examples/nonced-execution [<local|testnet>] [<source-chain>] [<destination-chain>] [<message>]`

### Send ack

This dapp sends a message from source-chain to destination-chain.

1. To deploy the dapp, run:

`node scripts/deploy examples/send-ack [<local|testnet>]`

2. To tst it, run:

`node scripts/test examples/send-ack [<local|testnet>] [<source-chain>] [<destination-chain>] [<message>]`

### Send token

This dapp sends aUSDC from the source to the destination. Run it on testnet. To test it:

1. Fund `0xBa86A5719722B02a5D5e388999C25f3333c7A9fb` with aUSDC.

2. Run:
 
`node scripts/test examples/send-token [<testnet>] [<source-chain>] [<destination-chain>] [<amount>]`

Send-token is a simple send transaction. There is no smart contract to deploy.

## Conclusion

With each example that you try, look for confirmation in the terminal output.


