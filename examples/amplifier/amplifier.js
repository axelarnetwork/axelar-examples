const commander = require('commander');
const { broadcast } = require('./endpoints/broadcast.js');
const { getReceipt } = require('./endpoints/get-receipt.js');
const { getPayload } = require('./endpoints/get-payload.js');
const { savePayload } = require('./endpoints/save-payload.js');
const { subscribe_to_approvals } = require('./endpoints/subscribe-to-approvals.js');
const { subscribe_to_wasm_events } = require('./endpoints/subscribe-to-wasm-events.js');
const { verify } = require('./endpoints/verify.js');

const program = new commander.Command();

program
    .command('broadcast')
    .requiredOption('-a, --address <contract address>', 'The address of the destination contract')
    .requiredOption("-p, --payload <payload>", "The payload of the wasm message")
    .action((options) => {
        broadcast(options.address, options.payload);
    });

program
    .command('get-receipt')
    .requiredOption("-r, --receipt-id <receipt id>", "The id of the receipt")
    .action((options) => {
        getReceipt(options.receiptId);
    });

program
    .command('get-payload')
    .requiredOption('--hash, <hash>', 'payload hash')
    .action((options) => {
        getPayload(options.hash);
    });

program
    .command('save-payload')
    .requiredOption('--payload, <payload>', 'payload')
    .action((options) => {
        savePayload(options.payload);
    });

program
    .command('subscribe-to-approvals')
    .requiredOption("-c, --chain <chain>", "The chain to subscribe to")
    .option("-s, --start-height <start height>", "The block height to start from (0 = latest)", parseInt, 0)
    .action((options) => {
        subscribe_to_approvals(options.chain, options.startHeight);
    });

program
    .command('subscribe-to-wasm-events')
    .option("-s, --start-height <start height>", "The block height to start from (0 = latest)", parseInt, 0)
    .action((startHeight) => {
        subscribe_to_wasm_events(startHeight)
    });

program
    .command('verify')
    .requiredOption("-i, --id <transaction id>", "The id of the transaction (txHash-logIndex)")
    .requiredOption("--source-chain <source chain>", "The source chain")
    .requiredOption("--source-address <source address>", "The source address")
    .requiredOption("--destination-chain <destination chain>", "The destination chain")
    .requiredOption("--destination-address <destination address>", "The destination address")
    .requiredOption("--payload <payload>", "The GMP payload in hex")
    .action((options) => {
        verify(options.id, options.sourceChain, options.sourceAddress, options.destinationChain, options.destinationAddress, options.payload);
    });

program.parse();