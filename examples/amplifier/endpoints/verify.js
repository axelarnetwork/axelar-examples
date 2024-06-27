const newClient = require('../grpc/client');

function verify(id, sourceChain, sourceAddress, destinationChain, destinationAddress, payload) {
    console.log("Verifying message with id, sourceChain, sourceAddress, destinationChain, destinationAddress, and payload:", id, sourceChain, sourceAddress, destinationChain, destinationAddress, payload);

    if (id.split('-').length != 2) {
        console.error("Invalid transaction id. Expected format: txHash-logIndex");
        process.exit(1);
    }
    payload = payload.replace('0x', '');

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
}

module.exports = {
    verify,
};