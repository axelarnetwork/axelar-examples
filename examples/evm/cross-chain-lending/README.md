# Cross-chain lending platform (Deprecated)

> Note: This example uses forecallable which is deprecated.
> Todo: Migrate to GMP Express.

This example demonstrates how to use the existing Compound Protocol to supply collateral and borrow tokens from a satellite chain to a fork of Ethereum's mainnet. Unlike the other examples in this repository, executing this one doesn't require the execution of the script scripts/start or scripts/deploy in order to run this test, the needed mainnet fork and the satellite chain are set up while running the test script itself.

### Prerequisite

Make sure you've already followed the following steps:

-   [Setup environment variables](/README.md#set-environment-variables)
-   [Run the local chains](/README.md#running-the-local-chains)

### Execution

To execute the example, use the following command:

```bash
npm run execute evm/cross-chain-lending [local|testnet]
```

The aforementioned command pertains to specifying the intended environment for a project to execute on. It provides the option to choose between local and testnet environments by appending either `local` or `testnet` after the command. 

An example of its usage is demonstrated as follows: `npm run execute evm/cross-chain-lending local` or `npm run execute evm/cross-chain-lending testnet`. 

## Example

This example runs the test on a local network.

```bash
npm run execute evm/cross-chain-lending local
```

The output will be::

```
------ Initial balances
User WBCT balance 100000000000000000000
User SUSHI balance 100000000000000000000
CompoundInterface CWBCT balance 0
CompoundInterface CSUSHI balance 0
------ Balances after supply and borrow
User WBCT balance 99989999999999000000
User SUSHI balance 100000000009999000000
CompoundInterface CWBCT balance 494939543254751868
CompoundInterface CSUSHI balance 0
------ Balances after repay and redeem
User WBCT balance 99999999999997999999
User SUSHI balance 99999999999998000000
CompoundInterface CWBCT balance 1
CompoundInterface CSUSHI balance 0
```

This example demonstrates the initial and final balances of the user's WBCT and SUSHI tokens, as well as the Compound Interface's CWBCT and CSUSHI tokens, after supplying and borrowing, as well as repaying and redeeming.
