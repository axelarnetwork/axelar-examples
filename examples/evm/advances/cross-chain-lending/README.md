# Cross-chain lending platform

Supply collateral and borrow tokens from a satellite chain to a fork of Ethereum's mainnet using existing Compound Protocol. Unlike the other examples in this repository, executing this one doesn't require the execution of the script `scripts/createLocal` or `scripts/deploy` in order to run this test, the needed mainnet fork and the satellite chain are setup while running the test script itself.

Deploy:

No need for prior deployment. Everything is setup while running the test.

Run the test:

```bash
node scripts/test examples/cross-chain-lending local
```

#### Example

```bash
node scripts/test examples/cross-chain-lending local
```

Output:

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
