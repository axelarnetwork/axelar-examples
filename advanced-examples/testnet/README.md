# Testnet

A hello-world example that showcases the transition from the local environment to testnet.

## What does it do?

The `ExecutableSample` contract keeps a string value in local storage. The `set` method sets the string to an arbitrary value such as `"hello world"` and then mirrors this value to a copy of `ExecutableSample` on another EVM chain. Learn more below and from the console output of the test.

## Run locally

> Remind to Install, Build and Compile first as defined in the root [README.md](../../README.md#install)

Spin up a local environment:

```bash
node advanced-examples/testnet/createLocal.js
```

Your machine now serves multiple RPC endpoints from `http://localhost:8500`.

In a new terminal:

If you haven't already, deploy the [`ExecutableSample.sol`](ExecutableSample.sol) contract to all chains.

```bash
node advanced-examples/testnet/deploy.js local
```

Run the test. Example:

```bash
node advanced-examples/testnet/test.js local avalanche moonbeam "hello world"
```

## Run live on testnet

All contracts for this example are already deployed live on all Axelar-supported EVM chains.

Ensure the address `0x87e41349C689081deB1F4909CDd37C661bDe3183` is funded with native tokens on each EVM chain so you can pay transaction fees.

Run the test. Example:

```bash
node advanced-examples/testnet/test.js testnet avalanche moonbeam "hello world"
```

### Optional: re-deploy your contract to EVM chains

If you want, you can re-deploy the [`ExecutableSample.sol`](ExecutableSample.sol) contract to a new address on all EVM chains.

```bash
node advanced-examples/testnet/deploy.js testnet
```

Update [testnet.json](testnet.json) to point to the new `executableSample` addresses of your [`ExecutableSample.sol`](ExecutableSample.sol) contract.

## Design

[`testnet.json`](testnet.json) contains information about all the chains in testnet. This is used by [`createLocaljs`](createLocal.js) to create a local set of chains that mimics the set of chains that exist accross testnets.

[`deploy.js`](deploy.js) takes an argument (`local`|`testnet`) and deploys [`ExecutableSample.sol`](ExecutableSample.sol) in the specified environment (`createLocal.js` has to be running in the background for this to work in local.). It also updates the json file specifying the information about the relevant chain. This has already been done for testnet, but feel free to redeploy them.

[`test.js`](test.js) takes four arguments:

- Environment (`local`|`testnet`)
- Source chain (`ethereum`|`avalanche`|`fantom`|`polygon`|`moonbeam`)
- Destination chain (`ethereum`|`avalanche`|`fantom`|`polygon`|`moonbeam`)
- Message (string) (be sure you use "" for multiword strings)

It replaces the value of the executable in both specified chains by only making a call to the source chain.
