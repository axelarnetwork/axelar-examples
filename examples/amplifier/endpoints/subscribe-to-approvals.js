const newClient = require('../grpc/client');

function subscribe_to_approvals(chain, startHeight) {
    console.log("Subscribing to approvals starting from block:", startHeight == 0 ? "latest" : startHeight, "on chain:", chain);

    const client = newClient();

    const call = client.SubscribeToApprovals({ startHeight: startHeight, chains: [chain] });
    call.on('data', (response) => {
        console.log("chain:", response.chain);
        console.log("block height:", response.blockHeight.toString());
        console.log("execute data:", response.executeData.toString('hex'));
        console.log("---");
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
    subscribe_to_approvals,
};