# Token Linker

Status: WIP

Deploy:

```bash
npm run deploy aptos/token-linker local
```

Run the test:

```bash
npm run execute aptos/token-linker local ${destChain} ${amount1} ${amount2}
```

**Default Values**:

-   `destChain` is `Avalanche`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `amount1` is `1e18`
-   `amount2` is `5e17/256**ignoreDigits`

## Example

```bash
npm run deploy aptos/token-linker local
npm run execute aptos/token-linker local "Avalanche" 10000000000 5000000000
```

Output:

```
Initializing token storage.
Initializing token linker destination.
--- Initially ---
Balance at Avalanche is 0 ALT
Balance at aptos is 4.499996527766274 ALT
Minting and Approving 1 ALT
--- After Mint and Approve ---
Balance at Avalanche is 1 ALT
Balance at aptos is 4.499996527766274 ALT
Sending token from Avalanche to aptos
--- After Send to Aptos ---
Balance at Avalanche is 7.71607494656e-7 ALT
Balance at aptos is 5.499995756158779 ALT
--- After Send to Avalanche ---
Balance at Avalanche is 0.5000003858037473 ALT
Balance at aptos is 4.9999961419625265 ALT
```
