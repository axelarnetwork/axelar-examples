const newClient = require('../grpc/client');

function savePayload(payload) {
    console.log("Saving payload", payload);

    const client = newClient();
    const savePayloadRequest = { payload: Buffer.from(payload, 'hex') };
    response = client.SavePayload(savePayloadRequest, (err, response) => {
        if (err) {
            console.error("Error", err);
            process.exit(1)
        }

        if (response) {
            console.log("Payload hash:\n" + response.hash);
            process.exit(0)
        }
    });
}

module.exports = {
    savePayload,
};