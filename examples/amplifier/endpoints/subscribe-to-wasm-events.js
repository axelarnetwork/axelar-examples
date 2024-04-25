const newClient = require('../grpc/client');

function subscribe_to_wasm_events(startHeight) {
    console.log("Subscribing to events starting from block:", startHeight == 0 ? "latest" : startHeight);

    const client = newClient();
    const call = client.SubscribeToWasmEvents(startHeight);
    call.on('data', (response) => {
        console.log("Event:", response);
    });
    call.on('end', () => {
        console.log("End");
    });
    call.on('error', (e) => {
        console.log("Error", e);
    });
    call.on('status', (status) => {
        console.log("Status", status);
    });
}

module.exports = {
    subscribe_to_wasm_events,
};