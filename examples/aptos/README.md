# Aptos Examples

## Prerequisite

1. Build the Aptos modules

```bash
npm ci
npm run build-aptos
```

2. Run the `aptos` local network

```bash
aptos node run-local-testnet --with-faucet
```

3. Run the `evm` local network

```bash
npm scripts/start
```

Note: `aptos` cli needs to be installed in your local machine (https://aptos.dev/cli-tools/aptos-cli-tool/)

## Basic

-   [call-contract](call-contract/)

## Advanced

-   [token-linker](token-linker/)
