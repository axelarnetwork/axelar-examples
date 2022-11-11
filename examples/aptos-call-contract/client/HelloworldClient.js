const { AptosClient, AptosAccount, HexString, TxnBuilderTypes } = require('aptos');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

class HelloWorldClient extends AptosClient {
    HELLO_WORLD_MODULE_ADDRESS = '0x8ac1b8ff9583ac8e661c7f0ee462698c57bb7fc454f587e3fa25a57f9406acc0';

    constructor(nodeUrl) {
        super(nodeUrl);
        this.ownerAccount = new AptosAccount(
            new HexString('0x2a6f6988be264385fbfd552b8aa93451c6aac25d85786dd473fe7159f9320425').toUint8Array(),
        );
    }

    async publishModule() {
        const modulePath = '../../../aptos-artifacts/hello_world/build/hello_world';
        const buildPath = '../modules/build/hello_world';
        const packageMetadata = fs.readFileSync(path.join(__dirname, buildPath, 'package-metadata.bcs'));
        const moduleDatas = ['hello_world.mv'].map((module) => {
            return fs.readFileSync(path.join(__dirname, modulePath, 'bytecode_modules', module));
        });

        const txnHash = await this.publishPackage(
            this.ownerAccount,
            new HexString(packageMetadata.toString('hex')).toUint8Array(),
            moduleDatas.map((moduleData) => new TxnBuilderTypes.Module(new HexString(moduleData.toString('hex')).toUint8Array())),
        );
        await this.waitForTransaction(txnHash, { checkSuccess: true });

        return txnHash;
    }

    async sendMessage(destinationChain, destinationContractAddress, msg, gasFeeAmount) {
        return this.generateSendMessageTxn(destinationChain, destinationContractAddress, msg, gasFeeAmount).then((rawTxn) =>
            this.signAndSubmit(rawTxn),
        );
    }

    async getMessage() {
        const resources = await this.getAccountResources(this.ownerAccount.address());
        const resourceType = `${this.ownerAccount.address().hex()}::hello_world::MessageHolder`;
        const resource = resources.find((r) => r.type === resourceType);
        const data = resource?.data;
        const message = data?.message;
        return message || '';
    }

    generateSendMessageTxn(destinationChain, destinationContractAddress, msg, gasFeeAmount) {
        const msgPayload = ethers.utils.defaultAbiCoder.encode(['string'], [msg]);

        return this.generateTransaction(this.ownerAccount.address(), {
            function: `${this.ownerAccount.address()}::hello_world::call`,
            type_arguments: [],
            arguments: [destinationChain, destinationContractAddress, new HexString(msgPayload).toUint8Array(), gasFeeAmount],
        });
    }

    async signAndSubmit(rawTxn) {
        const tx = await this.signTransaction(this.ownerAccount, rawTxn).then((signedTxn) => this.submitTransaction(signedTxn));

        await this.waitForTransaction(tx.hash);

        return tx;
    }
}

module.exports = {
    HelloWorldClient,
};
