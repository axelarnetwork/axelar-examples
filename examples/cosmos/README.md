# Cosmos Examples

## Prerequisite

-   Docker running on your local machine.

We will use this file to deploy to the wasm chain for this example.

## Enable Cosmos in Config

To start Axelar and Wasm chain when running `npm run start`, you've to set `cosmos: true` in [config/default.json](../../config/default.json).

## Run the EVM chains with Axelar and Wasm Chain

```
npm run start
```

This will take about 5 mins to start on the first run, since it needs to download the axelar and wasm docker images, setup axelar axelars, and creating an IBC connection between Wasm and Axelar chain.

## Basic

-   [call-contract](call-contract)
