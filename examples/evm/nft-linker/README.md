# NFT linker

This example sends the NFT that was originally minted at source-chain to destination-chain.

### Prerequisite

Make sure you've already followed the following steps:

-   [Setup environment variables](/README.md#set-environment-variables)
-   [Run the local chains](/README.md#running-the-local-chains)

### Deployment

To deploy the NFT Linker, run the following command:

```bash
npm run deploy evm/nft-linker [local|testnet]
```

The aforementioned command pertains to specifying the intended environment for a project to execute on. It provides the option to choose between local and testnet environments by appending either `local` or `testnet` after the command. 

An example of its usage is demonstrated as follows: `npm run deploy evm/nft-linker local` or `npm run deploy evm/nft-linker testnet`. 

A single NFT is minted to the deployer (`0xBa86A5719722B02a5D5e388999C25f3333c7A9fb`) on each chain.

## Execution

To execute the NFT Linker example, use the following command:

```bash
npm run execute evm/nft-linker [local|testnet] ${srcChain} ${destChain}
```

**Default Values**:

-   `srcChain` is `Avalanche`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `destChain` is `Fantom`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `amount` is `10`

**Note**:

It will fail if an attempt is made to send a duplicate NFT to a chain.

## Example

To deploy the NFT Linker locally and send the NFT originally minted on Avalanche to Polygon:

```bash
npm run deploy evm/nft-linker local
npm run execute evm/nft-linker local "Avalanche" "Fantom"
```

Output:

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
