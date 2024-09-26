## Introduction

This repo provides a code example for interacting with the Amplifier GMP API to relay transactions to the Axelar network and listen to Axelar events.

Please see the accompanying docs here: https://bright-ambert-2bd.notion.site/Amplifier-GMP-API-EXTERNAL-911e740b570b4017826c854338b906c8

## Setup

1. Clone this repo.
2. Install dependencies:
    ```bash
    npm install
    ```
3. Go to amplifier examples directory
    ```
    cd examples/amplifier
    ```
4. Copy `.env.example` into `.env` and set up the following environment variables:
    ```bash
    GMP_API_URL=...
    ```

## GMP example

### Make a Contract Call to the source chain

```typescript
import { providers, Wallet, ethers } from 'ethers';
import { config } from './config';
require('dotenv').config();

const gmpCall = async ({ srcGatewayAddress, destinationChain, message, destinationContractAddress }) => {
    const wallet = new Wallet(process.env.PRIVATE_KEY as string, new providers.JsonRpcProvider(config.avalanche.rpcUrl));
    const contractABI = ['function callContract(string destinationChain, string destinationContractAddress, bytes payload)'];
    const contract = new ethers.Contract(srcGatewayAddress, contractABI, wallet);
    // const destinationChain = "ethereum-sepolia";
    const payload = ethers.utils.hexlify(ethers.utils.toUtf8Bytes('hi'));
    const payloadHash = ethers.utils.keccak256(payload);

    try {
        const tx = await contract.callContract(destinationChain, destinationContractAddress || (await wallet.getAddress()), payload);
        console.log('Transaction hash:', tx.hash);

        const transactionReceipt = await tx.wait();

        return {
            transactionReceipt,
            payloadHash: payloadHash.slice(2),
            payload,
        };
    } catch (error) {
        console.error('Error calling contract:', error);
    }
};

// parameters below use `avalanche` from `devnet-amplifier`
gmpCall(`0xF128c84c3326727c3e155168daAa4C0156B87AD1`);
```

Here’s how a Contract Call looks on Ethereum Sepolia ([0x9b447614be654eeea0c5de0319b3f2c243ab45bebd914a1f7319f4bb599d8968](https://sepolia.etherscan.io/tx/0x9b447614be654eeea0c5de0319b3f2c243ab45bebd914a1f7319f4bb599d8968)). Notice that in the logs there’s a `ContractCall` event emitted.

<aside>
💡

if the Gateway contract is not verified for your chain, or you wish to retrieve the event programmatically, look for the following topic:

`0x30ae6cc78c27e651745bf2ad08a11de83910ac1e347a52f7ac898c0fbef94dae`

</aside>

### Make an Event API Call

Now, we are going to use the content of the Contract Call transaction, and make a `Call Event` request to the GMP API (see how Call Event is structured [here](https://www.notion.so/Amplifier-GMP-API-EXTERNAL-911e740b570b4017826c854338b906c8?pvs=21)).

```json
{
    "events": [
        {
            "destinationChain": "test-avalanche",
            "eventID": "0x9b447614be654eeea0c5de0319b3f2c243ab45bebd914a1f7319f4bb599d8968-1",
            "message": {
                "destinationAddress": "0xE8E348fA7b311d6E308b1A162C3ec0172B37D1C1",
                "messageID": "0x9b447614be654eeea0c5de0319b3f2c243ab45bebd914a1f7319f4bb599d8968-1",
                "payloadHash": "Y2YO3UuCRRackxbPYX9dWmNTYcnAMOommp9g4ydb3i4=",
                "sourceAddress": "0x9e3e785dD9EA3826C9cBaFb1114868bc0e79539a",
                "sourceChain": "test-sepolia"
            },
            "meta": {
                "finalized": true,
                "fromAddress": "0xba76c6980428A0b10CFC5d8ccb61949677A61233",
                "timestamp": "2024-09-11T13:32:48Z",
                "txID": "0x9b447614be654eeea0c5de0319b3f2c243ab45bebd914a1f7319f4bb599d8968"
            },
            "payload": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASaGVsbG8gdGVzdC1zZXBvbGlhAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
            "type": "CALL"
        }
    ]
}
```

Here’s how to retrieve these values from given the Contract Call transaction on the source chain:

-   `destinationChain`: the destination chain you used to make the contract call
-   `eventID`: the transaction hash of the submitted contract call + the index of the event in the transaction events (in the example above, the index is 1)

    ```bash
    TOPIC="0x30ae6cc78c27e651745bf2ad08a11de83910ac1e347a52f7ac898c0fbef94dae"
    TX_ID="0x9b447614be654eeea0c5de0319b3f2c243ab45bebd914a1f7319f4bb599d8968"

    receipt=$(curl -s $RPC -X POST -H "Content-Type: application/json" \
      --data '{"method":"eth_getTransactionReceipt","params":["0x9b447614be654eeea0c5de0319b3f2c243ab45bebd914a1f7319f4bb599d8968"],"id":1,"jsonrpc":"2.0"}')

    EVENT_INDEX=$(cat receipt | jq --arg TOPIC "$TOPIC" '.result.logs | map(.topics[0] == $TOPIC) | index(true)')

    echo "eventID: $TX_ID-$EVENT_INDEX"
    ```

-   `destinationAddress`: the destination address you used to make the contract call
-   `messageID`: in one-way Contract Calls, the message identifier is equivalent to the `eventID`. In two-way calls, the `messageID` is the `eventID` of the initial Contract Call at the first segment of the multi-hop chain.
-   `payloadHash`: This is available as the third topic of the event with the specific topic ID. You can extract it and encode it in base64:

    ```bash
    TOPIC="0x30ae6cc78c27e651745bf2ad08a11de83910ac1e347a52f7ac898c0fbef94dae"

    # get 3rd argument of topic, and stript starting "0x"
    payloadHashHex=$(echo $receipt | jq -r ".result.logs[] | select(.topics[0] == \"$TOPIC\") | .topics[2]" | cut -c 3-)

    # encode to base64
    payloadHash=$(echo -n "$payloadHashHex" | xxd -r -p | base64)

    echo "payloadHash: $payloadHash"
    ```

-   `sourceAddress`: This is the address that initiated the contract call. It can be extracted from the second topic of the event:

    ```bash
    TOPIC="0x30ae6cc78c27e651745bf2ad08a11de83910ac1e347a52f7ac898c0fbef94dae"

    # get the 2nd argument of the topic and keep the address (0x | 24 zeros | address )
    sourceAddress=$(cat receipt | jq -r --arg TOPIC "$TOPIC" '.result.logs[] | select(.topics[0] == $TOPIC) | .topics[1]' | cut -c 27-)

    echo "sourceAddress: 0x$sourceAddress"
    ```

-   `sourceChain`: This is the alias of the source chain as registered in amplifier.
-   `finalized`: Whether or not the transaction is finalized on the source chain. It’s not going to be processes until it’s flagged with `finalized: true` by the caller.
-   `fromAddress`(optional): This is the address that signed the transaction. It can be extracted directly from the receipt:

    ```bash
    fromAddress=$(echo $receipt | jq -r '.result.from')

    echo "fromAddress: $fromAddress"
    ```

-   `timestamp`(optional): This is not directly available in the receipt. It typically comes from the block timestamp. You'd need to fetch the block details to get this:

    ```bash
    # Extract block number (in hex)
    blockNumber=$(echo $receipt | jq -r '.result.blockNumber')

    # Fetch block data
    blockData=$(curl -s $RPC -X POST -H "Content-Type: application/json" \
      --data "{\"method\":\"eth_getBlockByNumber\",\"params\":[\"$blockNumber\", false],\"id\":1,\"jsonrpc\":\"2.0\"}")

    # Extract timestamp (in hex) and convert to decimal
    timestamp=$(echo $blockData | jq -r '.result.timestamp')
    timestampDec=$((16#${timestamp:2}))  # Remove '0x' prefix and convert hex to decimal

    formattedTimestamp=$(date -r $timestampDec -u +'%Y-%m-%dT%H:%M:%SZ')

    echo "timestamp: $formattedTimestamp"
    ```

-   `txID`(optional): This is the transaction hash
-   `payload`: This is the “payload” field of the contract call, encoded in base64. To extract it, you need to decode the data field of the topic.
-   `type`: This must be `CALL` for contract calls.

After the event payload is constructed, submit it to the API as such:

```bash
curl -X POST $GMP_API_URL/test-avalanche/events \
     -H "Content-Type: application/json" \
     -d '{
  "events": [
    {
      "destinationChain": "test-avalanche",
      "eventID": "0x9b447614be654eeea0c5de0319b3f2c243ab45bebd914a1f7319f4bb599d8968-1",
      "message": {
        "destinationAddress": "0xE8E348fA7b311d6E308b1A162C3ec0172B37D1C1",
        "messageID": "0x9b447614be654eeea0c5de0319b3f2c243ab45bebd914a1f7319f4bb599d8968-1",
        "payloadHash": "Y2YO3UuCRRackxbPYX9dWmNTYcnAMOommp9g4ydb3i4=",
        "sourceAddress": "0x9e3e785dD9EA3826C9cBaFb1114868bc0e79539a",
        "sourceChain": "test-sepolia"
      },
      "meta": {
        "finalized": true,
        "fromAddress": "0xba76c6980428A0b10CFC5d8ccb61949677A61233",
        "timestamp": "2024-09-11T13:32:48Z",
        "txID": "0x9b447614be654eeea0c5de0319b3f2c243ab45bebd914a1f7319f4bb599d8968"
      },
      "payload": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASaGVsbG8gdGVzdC1zZXBvbGlhAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
      "type": "CALL"
    }
  ]
}'
```

### Wait for the task to get published

Once the event is submitted an processed, a new `GATEWAY_TX` task will be published.
