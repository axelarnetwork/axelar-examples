const commander = require('commander');
const newClient = require('../grpc/client');

commander
    .usage(["[OPTIONS] ..."])
    .requiredOption("--hash, <payload hash>", "The hash of the payload")
    .parse(process.argv);

const hash = commander.opts().hash.replace('0x', '');

console.log("Getting payload for payload hash", hash);

const client = newClient();
const getPayloadHashRequest = { hash: Buffer.from(hash, 'hex') };
response = client.GetPayload(getPayloadHashRequest, (err, response) => {
    if (err) {
        console.error("Error", err);
        process.exit(1)
    }

    if (response) {
        console.log("Payload:\n" + response.payload.toString('hex'));
        process.exit(0)
    }
});
