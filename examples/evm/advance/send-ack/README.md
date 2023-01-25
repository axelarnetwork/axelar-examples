### Send ack

Send a message from source-chain to destination-chain.

**Deploy**

```bash
npm run deploy evm/send-ack [local|testnet]
```

Run the test:

```bash
npm run execute evm/send-ack [local|testnet] ${srcChain} ${destChain} ${message}
```

**Default Values**:

-   `srcChain` is `Avalanche`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `destChain` is `Fantom`. Valid values are Moonbeam, Avalanche, Fantom, Ethereum, and Polygon
-   `message` is `Hello World`

#### Example

```bash
npm run deploy evm/send-ack local
npm run execute evm/send-ack local "Fantom" "Moonbeam" 'Received'
```

**Output:**

```
--- Initially ---
SendAckReceiverImplementation at Moonbeam has 0 messages and the last one is "".
--- After ---
SendAckReceiverImplementation at Moonbeam has 1 messages and the last one is "Received".
```
