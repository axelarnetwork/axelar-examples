# Aptos Examples

## Prerequisite

1. Install Aptos in your local machine

Download here: https://aptos.dev/cli-tools/aptos-cli-tool/

Note: Our examples are tested on Aptos version `1.0.4`

2. Build the Aptos modules

```bash
npm ci
npm run build-aptos
```

3. Run the `aptos` local network

```bash
aptos node run-local-testnet --with-faucet
```

4. Run the local server

```bash
npm run start
```

## Basic

-   [call-contract](call-contract/)

## Advanced

-   [token-linker](token-linker/)
