const commander = require('commander');
const { getReceipt } = require('./endpoints/get-receipt.js');
const { getPayload } = require('./endpoints/get-payload.js');
const { savePayload } = require('./endpoints/save-payload.js');
const { processContractCallEvent } = require('./gmp-api/contract-call-event.js');
const { processMessageApprovedEvent } = require('./gmp-api/approve-event.js');
const { processMessageExecutedEvent } = require('./gmp-api/execute-event.js');
const { pollTasks } = require('./gmp-api/tasks.js');

const program = new commander.Command();

program
    .command('get-receipt')
    .requiredOption('-r, --receipt-id <receipt id>', 'The id of the receipt')
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
    .command('process-contract-call-event')
    .requiredOption('--source-chain <source chain>', 'The source chain')
    .requiredOption('--tx-hash <transaction hash>', 'The transaction hash')
    .option('--dry-run', 'Dry run the process')
    .action((options) => {
        processContractCallEvent(options.sourceChain, options.txHash, options.dryRun)
            .then(() => console.log('Process completed successfully'))
            .catch((error) => console.error('Process failed:', error));
    });

program
    .command('process-approve-event')
    .requiredOption('--destination-chain <destination chain>', 'The destination chain')
    .requiredOption('--tx-hash <transaction hash>', 'The transaction hash')
    .option('--amount <amount>', 'Remaining gas amount')
    .option('--dry-run', 'Dry run the process')
    .action((options) => {
        processMessageApprovedEvent(options.destinationChain, options.txHash, options.amount, options.dryRun)
            .then(() => console.log('Process completed successfully'))
            .catch((error) => console.error('Process failed:', error));
    });

program
    .command('process-execute-event')
    .requiredOption('--destination-chain <destination chain>', 'The destination chain')
    .requiredOption('--tx-hash <transaction hash>', 'The transaction hash')
    .requiredOption('--source-chain <source chain>', 'The source chain')
    .requiredOption('--message-id <message id>', 'The message id')
    .option('--amount <amount>', 'Remaining gas amount')
    .option('--dry-run', 'Dry run the process')
    .action((options) => {
        processMessageExecutedEvent(
            options.destinationChain,
            options.txHash,
            options.sourceChain,
            options.messageId,
            options.amount,
            options.dryRun,
        )
            .then(() => console.log('Process completed successfully'))
            .catch((error) => console.error('Process failed:', error));
    });

program
    .command('poll-tasks')
    .requiredOption('--chain <chain>', 'The chain to poll task for')
    .option('--poll-interval <interval>', 'The interval to poll for new tasks', parseInt, 5000)
    .option('--dry-run', 'Dry run the process')
    .action((options) => {
        pollTasks(options.chain, options.pollInterval, options.dryRun);
    });

program.parse();
