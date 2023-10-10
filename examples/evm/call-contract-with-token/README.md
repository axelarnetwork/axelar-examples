# Call Contract with Token

This example allows you to send aUSDC from a source chain to a destination chain and distribute it equally among specified accounts.

### Prerequisite

Make sure you've already followed the following steps:

-   [Setup environment variables](/README.md#set-environment-variables)
-   [Run the local chains](/README.md#running-the-local-chains)

### Deployment

To deploy the contract, run the following command:

```bash
npm run deploy evm/call-contract-with-token [local|testnet]
```

The aforementioned command pertains to specifying the intended environment for a project to execute on. It provides the option to choose between local and testnet environments by appending either `local` or `testnet` after the command.

An example of its usage is demonstrated as follows: `npm run deploy evm/call-contract-with-token local` or `npm run deploy evm/call-contract-with-token testnet`.

### Execution

To execute the example, use the following command:

```bash
npm run execute evm/call-contract-with-token [local|testnet] ${srcChain} ${destChain} ${amount} ${account} ${account2} ...
```

### Parameters

-   `srcChain`: The blockchain network from which the aUSDC will be transferred. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon. Default value is Avalanche.
-   `destChain`: The blockchain network to which the aUSDC will be transferred. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon. Default value is Fantom.
-   `amount`: The amount of aUSDC to be transferred and distributed among the specified accounts. Default value is 10.
-   `account`: The address of the first account to receive aUSDC.
-   `account2`: The address of the second account to receive aUSDC, and so on.

## Example

```bash
npm run deploy evm/call-contract-with-token local
npm run execute evm/call-contract-with-token local "Avalanche" "Fantom" 100 0xBa86A5719722B02a5D5e388999C25f3333c7A9fb
```

### Output:

```
--- Initially ---
0xBa86A5719722B02a5D5e388999C25f3333c7A9fb has 100 aUSDC
--- After ---
0xBa86A5719722B02a5D5e388999C25f3333c7A9fb has 199 aUSDC
```

## Tutorial

For a complete working example of using `callContractWithToken` on testnet to build a cross-chain airdrop dApp using Solidity, Next.js, and Axelar, check out the following tutorial:

[How to Build a Cross-Chain Airdrop DApp With Solidity, Next.js and Axelar](https://axelar.network/blog/cross-chain-airdrop-dapp-tutorial).

This in-depth tutorial walks through building a decentralized application for distributing tokens across multiple chains using Axelar's cross-chain communication protocol.

This tutorial guides you through a simple four-step process that empowers users to:
-  Connect their wallet.
-  Authorize the airdrop token amount for spending.
-  Add wallet addresses.
-  Distribute tokens from Polygon to Avalanche testnet via airdrop.
