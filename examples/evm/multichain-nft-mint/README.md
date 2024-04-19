# Multichain Swap NFT Mint

This example demonstrates how to mint an NFT on a destination chain via a message triggered from your source chain. It encodes a function signature of the `safeMint()` function and `calls` the function signature on the destination chain.

### Deployment

```bash
npm run deploy evm/multichain-nft-mint [local|testnet]
```

The aforementioned command pertains to specifying the intended environment for a project to execute on. It provides the option to choose between local and testnet environments by appending either `local` or `testnet` after the command.

An example of its usage is demonstrated as follows: `npm run deploy evm/multichain-nft-mint local` or `npm run deploy evm/multichain-nft-mint testnet`.

### Execution

To execute the Multichain NFT example, use the following command:

```bash
npm run execute evm/multichain-nft-mint [local|testnet]
```

### Example

```bash
npm run deploy evm/multichain-nft-mint local
npm run execute evm/multichain-nft-mint local "Avalanche" "Fantom" "0xc5DcAC3e02f878FE995BF71b1Ef05153b71da8BE" 1
```

Output:

```
--- Initially ---
balance of 0xc5DcAC3e02f878FE995BF71b1Ef05153b71da8BE at Fantom is "0"
--- After ---
balance of 0xc5DcAC3e02f878FE995BF71b1Ef05153b71da8BE at Fantom is "1"
```
