### Send ack

Send a message from source-chain to destination-chain.

Deploy:

```bash
node scripts/deploy examples/send-ack [local|testnet]
```

Run the test:

```bash
node scripts/test examples/send-ack [local|testnet] ${"source-chain"} ${"destination-chain"} ${'message'}
```

#### Example

```bash
node scripts/deploy examples/send-ack local
node scripts/test examples/send-ack local "Fantom" "Moonbeam" 'Received'
```

Output:

```
--- Initially ---
SendAckReceiverImplementation at Moonbeam has 0 messages and the last one is "".
--- After ---
SendAckReceiverImplementation at Moonbeam has 1 messages and the last one is "Received".
```
