const {getNetwork, relay} = require('@axelar-network/axelar-local-dev');

(async () => {
    // Connect to the Axelar network.
    const chain1 = await getNetwork('http://localhost:8511');
    const [user1] = chain1.userWallets;
    // Connect to the network that had a gateway manually deployed. The options are obtained by the output of exportNetworks.js
    const chain2 = await getNetwork('http://localhost:8512', {
        name: 'Chain2',
        chainId: 3000,
        userKeys: [
          '0x2eac7b0cadd960cd4457012a5e232aa3532d9365ba6df63c1b5a9c7846f77760',
          '0x6978af58909f6f9c337687a5ed3e11c884c06f3a8f3e57d8fc86ca08a7c5332a',
          '0xaab7c964bff9f1def14e9531754854568c6c591af4abba216fd82505f7b41ef1',
          '0x23eaf524fef9939896edd4fbb26f5f6ed71116f1e054f2ec1db459a8283dadda',
          '0x6a4a532c4fd7b37e7fdc7c84b83bbcdb36aae9e50bf1d28af45b8fc9751b6dc5',
          '0xa44d5e5c5c260301a5721f9a99d9c143fa29469b5952363845275c2dc67e4fef',
          '0xaa8823a4b271a698a9e994612f92ee0f6c75e0d0eb7009239583812886b9296c',
          '0x8e2e186c9d235a329a7afee24d053fb41f752531429550b28130a6eaff809cfa',
          '0x407553389af00efe112deeaef67dd9753ac50240f54bcc6b5cb3ffce858250f2',
          '0xa0aa5ccccc27c64427d53213144ad0ec84257980e7f26bf77a2932332203bab9'
        ],
        ownerKey: '0x569e75fc77c1a856f6daaf9e69d8a9566ca34aa47f9133711ce065a571af0cfd',
        operatorKey: '0x569e75fc77c1a856f6daaf9e69d8a9566ca34aa47f9133711ce065a571af0cfd',
        relayerKey: '0x569e75fc77c1a856f6daaf9e69d8a9566ca34aa47f9133711ce065a571af0cfd',
        adminKeys: [
          '0x569e75fc77c1a856f6daaf9e69d8a9566ca34aa47f9133711ce065a571af0cfd'
        ],
        threshold: 1,
        lastRelayedBlock: 0,
        gatewayAddress: '0x7a852C4F4ecc07164365B0def5F37b44B085C558',
        ustAddress: '0x9Dda7EcFB7C72B079bf64CDDd5e6dB995F6c5b0C',
        gasReceiverAddress: '0x21c54A49F03F3d2FbF60e53b0761A52564597af9'
      });
    const [user2] = chain2.userWallets;


    // Transfer some UST from chain1 to chain2.
    console.log('--- Before ---');
    console.log(`user1 has ${Number(await chain1.ust.balanceOf(user1.address))/1e6} UST.`);
    console.log(`user1 has ${Number(await chain2.ust.balanceOf(user2.address))/1e6} UST.`);
    // Approve the AxelarGateway to use our UST on chain1.
    await (await chain1.ust.connect(user1).approve(chain1.gateway.address, 10e6)).wait();
    // And have it send it to chain2.
    await (await chain1.gateway.connect(user1).sendToken(chain2.name, user2.address, 'UST', 10e6)).wait();
    await relay();
    console.log('--- After ---');
    console.log(`user1 has ${Number(await chain1.ust.balanceOf(user1.address))/1e6} UST.`);
    console.log(`user1 has ${Number(await chain2.ust.balanceOf(user2.address))/1e6} UST.`);
})();