# Aptos Examples

## Prerequisite

1. Install Aptos in your local machine

Download here: https://aptos.dev/cli-tools/aptos-cli-tool/

Note: Our examples are tested on Aptos version `1.0.4`

2. Setup Env

To set up your environment:

-   If you don't have a `.env` file, run `npm run setup` to create one quickly.
-   If you already have a `.env` file but it's missing the `APTOS_TOKEN_LINKER_ADDRESS` and `APTOS_ADDRESS` variables, copy them from the `.`env.example` file.

3. Build the Aptos modules

```bash
npm ci
npm run build
npm run build-aptos
```

5. Run the `aptos` local network

```bash
aptos node run-local-testnet --with-faucet --force-restart
```

6. Run the local server

```bash
npm run start
```

## Basic

-   [call-contract](call-contract/)

## Advanced

-   [token-linker](token-linker/)
