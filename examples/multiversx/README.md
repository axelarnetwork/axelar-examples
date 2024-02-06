# MultiversX Examples

## Prerequisite

0. You should have Docker & Docker Compose installed.

1. Install Mxpy CLI Tool

Download from here: https://docs.multiversx.com/sdk-and-tools/sdk-py/installing-mxpy/

> **Note**: Our examples are tested on Mxpy version `9.4.1`, but newer versions might also work.

2. Optional: Build MultiversX contracts (make sure you use Rust Nightly version at least 1.76.0 - nightly-2023-12-11).
However this is optional, a default wasm contract is provided.

```bash
npm run build-multiversx
```

3. Run Elasticsearch

`dcker-compose up -d` (in this folder)

4. Create & run a MultiversX Localnet

More info: https://docs.multiversx.com/developers/setup-local-testnet

```bash
mkdir -p .multiversx && cd .multiversx
mxpy localnet setup
```

You will now have `localnet` folder populate with the subfolders `validator00`, `validator01`, `validator02`.

Copy the [external.toml](external.toml) from this folder into all the validators `config` folder (eg full path: `.multiversx/localnet/validator00/config`)
and overwrite the existing file.

This will connect MultiversX nodes to Elasticsearch to index events used by the MultiversXRelayer.

Then start the localnet: (wait a bit afterwards for everything to initialize)

```bash
mxpy localnet start
````

5. Check that `multiversx` - `enabled` flag is set to `true` in `config/default.json` file

6. Run the local server (from the project root)

```bash
npm run start
```

Wait for all the contracts to be successfully deployed.

## Basic

-   [call-contract](call-contract/)
