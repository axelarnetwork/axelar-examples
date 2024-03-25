const commander = require('commander');
const newClient = require('../grpc/client');

commander
    .usage(["[OPTIONS] ..."])
    .option("-s, --start-height <start height>", "The block height to start from (0 = latest)", parseInt, 0)
    .parse(process.argv);

startHeight = commander.opts().startHeight;

console.log("Subscribing to events starting from block:", startHeight == 0 ? "latest" : startHeight);

const client = newClient();
const call = client.SubscribeToWasmEvents({ startHeight: startHeight });
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