const commander = require('commander');
const newClient = require('../grpc/client');

commander
    .usage(["[OPTIONS] ..."])
    .requiredOption("-a, --address <contract address>", "The address of the destination contract")
    .requiredOption("-p, --payload <payload>", "The payload of the wasm message")
    .parse(process.argv);

const address = commander.opts().address;
if (!address) {
    console.error("Address is required");
    process.exit(1);
}

const payload = commander.opts().payload;
if (!payload) {
    console.error("Payload is required");
    process.exit(1);
}
try {
    JSON.parse(payload);
} catch (e) {
    console.error("Payload is not valid JSON");
    process.exit(1);
}

console.log("Broadcasting message:\n", address, payload);

const client = newClient();
const broadcastRequest = { address, payload: Buffer.from(payload) };
response = client.Broadcast(broadcastRequest, (err, response) => {
    if (err) {
        console.error("Error", err);
    } else {
        console.log("Message sent for broadcast");
        process.exit(0);
    }
});
