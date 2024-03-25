const commander = require('commander');
const newClient = require('../grpc/client');

commander
    .usage(["[OPTIONS] ..."])
    .requiredOption("-c, --chain <chain>", "The chain to subscribe to")
    .option("-s, --start-height <start height>", "The block height to start from (0 = latest)", parseInt, 0)
    .parse(process.argv);

const options = commander.opts();

const chain = options.chain;
const startHeight = options.startHeight;

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