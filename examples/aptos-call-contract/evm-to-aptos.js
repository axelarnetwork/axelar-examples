const { createNetwork, relay, createAptosNetwork, deployContract } = require('@axelar-network/axelar-local-dev');
const { HelloWorldClient } = require('./client/helloworldClient');
const HelloWorldArtifact = require('../../artifacts/examples/aptos-call-contract/contracts/HelloWorld.sol/HelloWorld.json');

async function main() {
    // Step 1: Create AptosNetwork instance and deploy Axelar modules.
    const aptosNetwork = await createAptosNetwork();

    // Step 2: Spin up EVM chain
    const eth = await createNetwork({
        name: 'ethereum',
    });

    console.log('\n====================  Network Setup Completed ==================== \n');

    // Step 3: Deploy HelloWorld contract on Ethereum
    const contract = await deployContract(eth.ownerWallet, HelloWorldArtifact, [eth.gateway.address, eth.gasReceiver.address]);
    console.log(`HelloWorld contract is deployed on ${eth.name} at:`, contract.address);

    // Step 4: Deploy HelloWorld module on Aptos
    const helloClient = new HelloWorldClient(aptosNetwork.nodeUrl);
    await helloClient.publishModule();
    console.log('HelloWorld module is deployed on Aptos at:', helloClient.ownerAccount.address().hex());

    console.log('\n====================  Deployment Completed ==================== \n');

    // Step 5: Send a Message to HelloWorld module on Aptos
    const msg = 'Hello Aptos from Ethereum! (Bridged by Axelar)';
    const fee = 1e6;
    const evmTx = await contract
        .connect(eth.ownerWallet)
        .setRemoteValue('aptos', `${helloClient.ownerAccount.address().hex()}::hello_world`, msg, { value: fee })
        .then((tx) => tx.wait());
    console.log('Sent msg From Ethereum:', evmTx.transactionHash);

    // Step 6: Relay transaction from Aptos to Ethereum
    await relay();
    console.log(`The transaction is relayed to ${eth.name} successfully.`);

    // Step 7: Print updated contract state
    const helloMsg = await helloClient.getMessage();
    console.log('\nHelloWorld msg on Aptos:', helloMsg);
}

main();
