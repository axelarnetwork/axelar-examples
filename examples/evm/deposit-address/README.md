# Deposit Address

This test demonstrates how to deposit tokens from one chain to another using a deposit address.


### Context

This example demonstrates how to deposit 10e14 tokens from Avalanche chain to Fantom chain using a deposit address. The initial balance of the Avalanche chain and Fantom chain is `1.000`. After the execution, the balance of Avalanche chain is `0.999` and the balance of Fantom chain is `1.001`. 

A deposit address is a unique temporary address that is generated to facilitate transfers between chains. Deposit Addresses are an additional mechanism to sendToken() for sending tokens between chains. In the case of sendToken(), it is directly interacting with the gateway contract, whereas deposit addresses allow for interoperable token transfers via addresses that may be generated off chain. The goal is to allow for a similar user experience to centralized exchanges in sending funds between chains. 
[Further reading available here](https://docs.axelar.dev/dev/axelarjs-sdk/token-transfer-dep-addr)

The flow can be though of as: 
1. (on source) Sender ---> deposit address 
2. Axelar network verifies, confirms, and approves
3. (on destination) Gateway ---> receiver (token unlocked/minted)


### Prerequisite

Make sure you've already followed the following steps:

-   [Setup environment variables](/README.md#set-environment-variables)
-   [Run the local chains](/README.md#running-the-local-chains)

### Execution

To execute the example, use the following command:

```bash
npm run execute evm/deposit-address [local|testnet] 
```

**Default Values**:

-   `srcChain` is `Avalanche`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `destChain` is `Fantom`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `amount` is `10e6`

### Note

-   If running on testnet, ensure that `0xBa86A5719722B02a5D5e388999C25f3333c7A9fb` is funded with aUSDC. This address is used to deploy and test all examples and is funded by default in the local environment when you run start. To make sure that it's funded on all five supported testnets, run `node/printBalances`.

## Example

```bash
npm run execute evm/deposit-address local
```

The output will be:

```
--- Initially ---
Balance at Avalanche is 1.000
Balance at Fantom is 1.000
[deposit address]
--- After ---
Balance at Avalanche is 0.999
Balance at Fantom is 1.001
```