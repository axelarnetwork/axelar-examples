const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const getConfig = require('../config');

function newClient() {
    const packageDefinition = protoLoader.loadSync("amplifier.proto");
    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
    const amplifierService = protoDescriptor.axelar.amplifier.v1beta1.Amplifier;

    const { serverHOST, serverPort } = getConfig();

    console.log(`Connecting to server at ${serverHOST}:${serverPort}`);

    return new amplifierService(`${serverHOST}:${serverPort}`, grpc.credentials.createInsecure());
}

module.exports = newClient;