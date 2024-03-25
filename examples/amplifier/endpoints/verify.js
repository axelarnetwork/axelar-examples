const commander = require('commander');
const newClient = require('../grpc/client');

commander
    .usage(["[OPTIONS] ..."])
    .requiredOption("-i, --id <transaction id>", "The id of the transaction (txHash:logIndex)")
    .requiredOption("--source-chain <source chain>", "The source chain")
    .requiredOption("--source-address <source address>", "The source address")
    .requiredOption("--destination-chain <destination chain>", "The destination chain")
    .requiredOption("--destination-address <destination address>", "The destination address")
    .requiredOption("--payload <payload>", "The GMP payload in hex")
    .parse(process.argv);

const options = commander.opts();

const id = options.id;
if (id.split(':').length != 2) {
    console.error("Invalid transaction id. Expected format: txHash:logIndex");
    process.exit(1);
}
const sourceChain = options.sourceChain;
const sourceAddress = options.sourceAddress;
const destinationChain = options.destinationChain;
const destinationAddress = options.destinationAddress;
const payload = options.payload.replace('0x', '');

request = {
    message: {
        id: id,
        sourceChain: sourceChain,
        sourceAddress: sourceAddress,
        destinationChain: destinationChain,
        destinationAddress: destinationAddress,
        payload: Buffer.from(payload, 'hex'),
    },
};

const client = newClient();
const verifyStream = client.Verify();

console.log("Verifying message:", request);

verifyStream.on('data', function (response) {
    if (response.error) {
        console.error('Error:', response.error);
    } else {
        console.log('Success verification for', response.message.id);
        process.exit(0);
    }
});

verifyStream.on('end', function () {
    console.log('Server has completed sending responses.');
});

verifyStream.on('error', function (e) {
    console.error('Error: ', e);
});

verifyStream.on('status', function (status) {
    console.log('Status: ', status);
});

verifyStream.write(request);
