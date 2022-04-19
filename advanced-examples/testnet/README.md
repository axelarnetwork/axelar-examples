# Remote
This example showcases the transition from the local environment to testnet.

[`testnet.json`](testnet.json) contains information about all the chains in testnet. This is used by [`createLocaljs`](createLocal.js) to create a local set of chains that mimics the set of chains that exist accross testnets.

[`deploy.js`](deploy.js) takes an argument (`local`|`testnet`) and deploys [`ExecutableSample.sol`](ExecutableSample.sol) (see the general-message-passing example) in the specified environment (`createLocal.js` has to be running in the background for this to work in local.). It also updates the json file specifying the information about the relevant chain. This has already been done for testnet, but feel free to redeploy them.

[`test.js`](test.js) takes four arguments:
- Environment (`local`|`testnet`)
- Source chain (`ethereum`|`avalanche`|`fantom`|`polygon`|`moonbeam`) 
- Destination chain (ethereum|avalanche|fantom|polygon|moonbeam)
- Message (string) (be sure you use "" for multiword strings)
It replaces the value of the executable in both specified chains by only making a call to the source chain.
