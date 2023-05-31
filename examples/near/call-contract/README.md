# Call Contract

Relay messages between NEAR and EVM chains.

Run the test:

```bash
npm run execute near/call-contract local ${evmChain} ${mesageFromEvm} ${messageFromNear}
```

**Default Values**:

-   `evmChain` is by default `Avalanche`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `mesageFromEvm` is message that will be sent by EVM to NEAR
-   `messageFromNear` is message that will be sent by NEAR to EVM

## Example

Run using default EVM chain and messages:

```bash
npm run execute near/call-contract local
```

Output (your time will be different than the one in the example below):

```
--- Initially ---
value at Avalanche is ""
value at NEAR is "null"
--- After ---
value at Avalanche is "Hello Avalanche from NEAR, it is 4:29:05 PM."
value at NEAR is "Hello NEAR from Avalanche, it is 4:29:05 PM."
```

Run by providing values for `evmChain`, `mesageFromEvm` and `messageFromNear`:

```bash
npm run execute near/call-contract local "Moonbeam" 'Hello from Moonbeam' 'Hello from NEAR'
```

Output:

```
--- Initially ---
value at Moonbeam is ""
value at NEAR is "null"
--- After ---
value at Moonbeam is "Hello from NEAR"
value at NEAR is "Hello from Moonbeam"
```

## Changing the example

If you wish to test things out and change the smart contracts you can find them in `examples/near/call-contract/contract`.

Folder named `near-axelar-contract-call-example` has the NEAR smart contract written in programming language `Rust`.

To make adjustments to it you just need to change `lib.rs` file located at `examples/near/call-contract/contract/near-axelar-contract-call-example/src/lib.rs`.

File named `HelloWorld.sol` has the EVM smart contract and you can make changes to it there.

Once you are done with making changes you need to build the contracts

Build NEAR contract:

```bash
npm run build-near
```

Build EVM contract:

```bash
npm run build
```
