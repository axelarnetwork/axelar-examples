### NFT linker

Send the NFT that was originally minted at source-chain to destination-chain.

Deploy:

```bash
node scripts/deploy examples/nft-linker [local|testnet]
```

A single NFT is minted to the deployer (`0xBa86A5719722B02a5D5e388999C25f3333c7A9fb`) on each chain.

Run the test:

```bash
node scripts/test examples/nft-linker [local|testnet] ${srcChain} ${destChain}
```

**Default Values**:

-   `srcChain` is `Avalanche`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `destChain` is `Fantom`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `amount` is `10`

**Note**:

It's not possible to send a duplicate NFT to a chain. The dApp fails when the NFT is already at the destination-chain.

#### Example

```bash
node scripts/deploy examples/nft-linker local
node scripts/test examples/nft-linker local "Avalanche" "Polygon"
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
