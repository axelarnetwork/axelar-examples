const newClient = require('../grpc/client');

function getPayload(hash) {
    console.log("Getting payload for payload hash", hash);

    hash = hash.replace('0x', '');

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
}

module.exports = {
    getPayload,
};