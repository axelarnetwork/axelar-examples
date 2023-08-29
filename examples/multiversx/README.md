# MultiversX Examples

## Prerequisite

1. Install Mxpy CLI Tool

Download from here: https://docs.multiversx.com/sdk-and-tools/sdk-py/installing-mxpy#install-using-mxpy-up-recommended

_Note: Our examples are tested on Mxpy version `7.3.0`, but newer versions might also work._

2. Build MultiversX contracts

```bash
npm ci
npm run build
npm run build-multiversx
```

3. Create & run a MultiversX Localnet

More info: https://docs.multiversx.com/developers/setup-local-testnet

```bash
mkdir -p .multiversx && cd .multiversx
mxpy localnet setup
mxpy localnet start
```

4. Check that `multiversx` - `enabled` flag is set to `true` in `config/default.json` file

5. Run the local server

```bash
npm run start
```

## Basic

-   [call-contract](call-contract/)
