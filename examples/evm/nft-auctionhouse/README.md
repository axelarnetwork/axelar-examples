# NFT Auction House

Status: WIP

> Note: Cross-chain refunds use `callContractWithToken` back to the auction house on the source chain (the disabled `sendToken` might cause loss of funds).
> Only the outgoing bid pays for destination gas via `IAxelarGasService`, so the refund leg is relayed automatically in the local environment only.
> On testnet the refund call additionally needs a gas payment for the source-chain auction house to be executed.
