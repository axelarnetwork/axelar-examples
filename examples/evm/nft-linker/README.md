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

### Test

`cd` into `evm` folder
Run the command `npx hardhat test nft-linker/tests/NftLinker.test.js`

## Execution

To execute the NFT Linker example, use the following command:

```bash
npm run execute evm/nft-linker [local|testnet] ${srcChain} ${destChain}
```

**Default Values**:

-   `srcChain` is `Avalanche`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `destChain` is `Fantom`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon

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
==== Initially ====
Minted token ID: '552232130' for Avalanche
Token '552232130' was originally minted at Avalanche is at Avalanche.

==== Approve Original NFT to NFTLinker's contract if needed ====
Approved Original NFT (552232130) to NFTLinker's contract
Tx Approved Hash: 0xb4f199d17785141f933f58e26d62b646461fd18ac878f4c62be10beea7aeab3d

==== Send NFT to NFTLinker's contract ====
Sent NFT 552232130 to NFTLinker's contract 0xa7df30a120c4a99f1843f5df6b5de7cc71fb55046cc25e7bdab5b60def1463ab
Token ID at Fantom will be: '106441082702920043141391782483983459619906865214019059855714686922452481221015'

==== Verify Result ====
Token '106441082702920043141391782483983459619906865214019059855714686922452481221015' was originally minted at Avalanche is at Fantom.

==== Approve Remote NFT to NFTLinker's contract ====
Approved Remote NFT (106441082702920043141391782483983459619906865214019059855714686922452481221015) to NFTLinker's contract
Tx Approved Hash: 0xc2d9c3628ffafea2df0e990bb103a5e2aa5d08ebc5e6f039dec21f17a6cf8699

==== Send NFT back from 'Avalanche' to Fantom ====
Sent NFT 106441082702920043141391782483983459619906865214019059855714686922452481221015 back to Avalanche 0x528bf12f90ac1468dd655624be544ef55c6948bc32bdeb373b7bdec8bec3ff5d

==== Verify Result ====
Token '552232130' was originally minted at Avalanche is at Avalanche.
```
