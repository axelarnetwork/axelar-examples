const newClient = require('../grpc/client');

function broadcast(address, payload) {
    console.log("Broadcasting message:\n", address, payload);

    try {
        JSON.parse(payload);
    } catch (e) {
        console.error("Payload is not valid JSON");
        process.exit(1);
    }

    const client = newClient();
    const broadcastRequest = { address, payload: Buffer.from(payload) };
    response = client.Broadcast(broadcastRequest, (err, response) => {
        if (err) {
            console.error("Error", err);
        } else {
            console.log("Message sent for broadcast", response);
            process.exit(0);
        }
    });
}

module.exports = {
    broadcast,
};