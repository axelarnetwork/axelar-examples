const { providers, Wallet, ethers } = require('ethers');

const contractABI = [
    'event ContractCall(address sender, string destinationChain, string destinationContractAddress, bytes32 payloadHash, bytes payload)',
    'function callContract(string destinationChain, string destinationContractAddress, bytes payload)',
];

const gmp = async ({ srcGatewayAddress, destinationChain, message, destinationContractAddress }, config) => {
    const wallet = new Wallet(process.env.EVM_PRIVATE_KEY, new providers.JsonRpcProvider(config['avalanche-fuji'].rpcUrl));

    const contract = new ethers.Contract(srcGatewayAddress, contractABI, wallet);
    const payload = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message));
    const payloadHash = ethers.utils.keccak256(payload);

    try {
        const tx = await contract.callContract(destinationChain, destinationContractAddress || (await wallet.getAddress()), payload);
        const transactionReceipt = await tx.wait();

        console.log({ transactionReceipt });

        return {
            transactionReceipt,
            payloadHash: payloadHash.slice(2),
            payload,
        };
    } catch (error) {
        throw new Error(`Error calling contract: ${error}`);
    }
};

module.exports = {
    gmp,
};
