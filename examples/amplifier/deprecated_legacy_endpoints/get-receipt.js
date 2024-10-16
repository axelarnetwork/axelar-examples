const newClient = require('../grpc/client');

function getReceipt(receiptId) {
    console.log("Getting receipt with id:", receiptId);

    const client = newClient();
    const getReceiptRequest = { receiptId: receiptId };
    response = client.GetReceipt(getReceiptRequest, (err, response) => {
        if (err) {
            console.error("Error", err);
            process.exit(1)
        }

        if (response) {
            console.log("Receipt:\n" + response.txHash);
            process.exit(0)
        }
    });
}

module.exports = {
    getReceipt,
}