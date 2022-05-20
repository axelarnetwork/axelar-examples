# Axelar Local Dev Sample

This repo provides a basic usage of https://github.com/axelarnetwork/axelar-local-dev

## Install

1. Run `npm update && npm install`.
2. Run `npm run build` to compile all contracts.

## Examples

To run any example on your local machine first run `node scripts/createLocal` on a separate terminal.

All examples use `0xBa86A5719722B02a5D5e388999C25f3333c7A9fb` as the user that deploys and runs all tests. This address is funded by default when creating a local set of chains. Make sure it is funded on testnets as well. Run `node/printBalances` (optionally specify an address if you wish to check an address other than the one above) to check the balances on all five supported testnets of any address.

## Deployment

Some examples need to first be deployed on the network you wish to run them on. To do this simply run `node scripts/deploy examples/${name} ${local|testnet}`. Replace `${var}` appropriately. Cannot be run for the `sent-token` and `deposit-address` examples as no deployment is needed.

## Testing

All examples can be tested with `node scripts/test/{example-name} ${local|testnet} ...params`. See below for what values params can take. All params are optional and have default values and can be ommited.

### Sent token

Run `node scripts/test examples/send-token ${local|testnet} ${source-chain} ${destination-chain} ${amount}` to send aUSDC from the source to the destination. To run on testnet you need to fund `0xBa86A5719722B02a5D5e388999C25f3333c7A9fb` with aUSDC and replace `local` with `testnet`.

### Deposit Address

Run `node scripts/test examples/deposti-address ${local|testnet} ${source-chain} ${destination-chain} ${amount}` to send aUSDC from the source to the destination. To run on testnet you need to fund `0xBa86A5719722B02a5D5e388999C25f3333c7A9fb` with aUSDC and replace `local` with `testnet`.

### Call contract

Run `node scripts/test examples/call-contract ${local|testnet} ${source-chain} ${destination-chain} ${message}` to relay a message from `source-chain` to `destination-chain`.

Run `yarn call-contract`

### Call contract with Token

Run `node scripts/test examples/call-contract-with-token ${local|testnet} ${source-chain} ${destination-chain} ${amount} ${account1} ${account2}...` to send aUSDC from `source-chain` to `destination-chain` and distribute it equally among all accounts sepcified.

### Headers

Run `node scripts/test examples/headers ${local|testnet} ${source-chain} ${destination-chain}` to inform `destination-chain` of the last header of `source-chain`.

### NFT Linker

When deploying a singe NFT is minted to the deployer (`0xBa86A5719722B02a5D5e388999C25f3333c7A9fb`) on each chain.

Run `node scripts/test examples/nft-linker ${local|testnet} ${source-chain} ${destination-chain}` to send the NFT that was originally minted at `source-chain` to `destination-chain`. Will fail if the NFT is already at the `destination-chain`.

### Cross Chain Token

Run `node scripts/test examples/cross-chain-token ${local|testnet} ${source-chain} ${destination-chain} ${amount}` to mint some token at `source-chain` and have it sent to `destination-chain`.

### Nonced Execution

Run `node scripts/test examples/nonced-execution ${local|testnet} ${source-chain} ${destination-chain} ${message}` to send a `message` from `source-chain` to `destination-chain`. 

### SendAck

Run `node scripts/test examples/send-ack ${local|testnet} ${source-chain} ${destination-chain} ${message}` to send a `message` from `source-chain` to `destination-chain`.

