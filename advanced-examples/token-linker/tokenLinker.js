'use strict';

const { relay, createNetwork, getGasPrice, utils: { deployContract } } = require('@axelar-network/axelar-local-dev');
const { Contract } = require('ethers');

const MirroredTokenLinker = require('../../build/MirroredTokenLinker.json');
const SourceTokenLinker = require('../../build/SourceTokenLinker.json');
const SourceToken = require('../../build/SourceToken.json');
const MirroredToken = require('../../build/SourceToken.json');


(async () => {
    // Create three local networks.
    const chain1 = await createNetwork();
    const [user1] = chain1.userWallets;
    const chain2 = await createNetwork();
    const [user2] = chain2.userWallets;
    const chain3 = await createNetwork();
    const [user3] = chain3.userWallets;

    // Create a token that lives on chain1.
    const name = 'Test Token'
    const symbol = 'TEST';
    const initialAmount = 1e6;
    const token1 = await deployContract(user1, SourceToken, [name, symbol, initialAmount]);

    // Deploy our IAxelarExecutable contracts:
    // This one links the pre-existing token.
    const linker1 = await deployContract(user1, SourceTokenLinker, [chain1.gateway.address, chain1.gasReceiver.address, token1.address]);
    // These two link mirrored tokens deployed as part of the linker deployment
    const linker2 = await deployContract(user2, MirroredTokenLinker, [chain2.gateway.address, chain2.gasReceiver.address, `Wrapped ${name}`, symbol]);
    const linker3 = await deployContract(user3, MirroredTokenLinker, [chain3.gateway.address, chain3.gasReceiver.address, `Wrapped ${name}`, symbol]);
    // There are the mirrored tokens linked.
    const token2 = new Contract(
        await linker2.token(),
        MirroredToken.abi,
        chain2.provider,
    );
    const token3 = new Contract(
        await linker3.token(),
        MirroredToken.abi,
        chain3.provider,
    );

    // Inform our exeuctables about each other.
    await (await linker1.connect(user1).addLinker(chain2.name, linker2.address)).wait();
    await (await linker1.connect(user1).addLinker(chain3.name, linker3.address)).wait();
    await (await linker2.connect(user2).addLinker(chain1.name, linker1.address)).wait();
    await (await linker2.connect(user2).addLinker(chain3.name, linker3.address)).wait();
    await (await linker3.connect(user3).addLinker(chain1.name, linker1.address)).wait();
    await (await linker3.connect(user3).addLinker(chain2.name, linker2.address)).wait();

    // This is used for logging.
    const print = async () => {
        console.log(`user1 has ${await token1.balanceOf(user1.address)} ${symbol}.`);
        console.log(`user2 has ${await token2.balanceOf(user2.address)} ${symbol}.`);
        console.log(`user3 has ${await token3.balanceOf(user3.address)} ${symbol}.`);
    }

    //These are constant in these dev tools but in actual releases. 
    const gasLimit = 1e6;
    const gasPrice = getGasPrice(chain1, chain2, chain1.ust.address);

    console.log('--- Initially ---');
    await print();
    
    await chain1.giveToken(user1.address, 'UST',  gasPrice * gasLimit);
    await (await chain1.ust.connect(user1).approve(linker1.address, gasPrice * gasLimit)).wait();
    //Approve linker1 to use our UST on chain1.
    await (await token1.connect(user1).approve(linker1.address, 100000)).wait();
    // And have it send it to chain2.
    await (await linker1.connect(user1).sendTo(chain2.name, user2.address, 100000, chain1.ust.address, gasPrice * gasLimit)).wait();
    // This facilitates the send.
    await relay();
    // After which the funds have reached chain2
    console.log('--- After Sending 100000 from chain1 to chain2 ---');
    await print();


    await chain2.giveToken(user2.address, 'UST',  gasPrice * gasLimit);
    await (await chain2.ust.connect(user2).approve(linker2.address,  gasPrice * gasLimit)).wait();
    // We don't need to approve MirroredTokenLinker since it controls the MirroredToken.
    await (await linker2.connect(user2).sendTo(chain3.name, user3.address, 50000, chain2.ust.address, gasPrice * gasLimit)).wait();
    await relay();
    console.log('--- After Sending 50000 from chain2 to chain3 ---');
    await print();


    await chain3.giveToken(user3.address, 'UST',  gasPrice * gasLimit);
    await (await chain3.ust.connect(user3).approve(linker3.address,  gasPrice * gasLimit)).wait();
    await (await linker3.connect(user3).sendTo(chain1.name, user1.address, 10000, chain3.ust.address, gasPrice * gasLimit)).wait();
    await relay();
    console.log('--- After Sending 10000 from chain3 to chain1 ---');
    await print();
})();