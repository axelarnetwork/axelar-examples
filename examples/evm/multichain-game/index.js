'use strict';

const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');

const MultichainGame = rootRequire('./artifacts/examples/evm/multichain-game/MultichainGame.sol/MultichainGame.json');
const MultichainGameReceiver = rootRequire(
    './artifacts/examples/evm/multichain-game/MultichainGameReceiver.sol/MultichainGameReceiver.json',
);

async function deploy(chain, wallet) {
    chain.multichainGame = await deployContract(wallet, MultichainGame, [chain.gateway, chain.gasService]);
    console.log(`Deployed Multichain Game for ${chain.name} at address: ${chain.multichainGame.address}.`);

    chain.multichainReceiver = await deployContract(wallet, MultichainGameReceiver, [
        chain.gateway,
        chain.gasService,
        chain.multichainGame.address,
    ]);
    console.log(`Deployed Multichain Receiver for ${chain.name} at ${chain.multichainReceiver.address}.`);

    chain.wallet = wallet;
}

async function execute(chains, wallet, options) {
    const args = options.args || [];
    let guess;
    const { source, destination, calculateBridgeFee } = options;
    guess = args[2];
    const token = args[3];
    const amount = args[4];

    const originalBalance = await source.usdc.balanceOf(wallet.address);

    function log(guess) {
        console.log(`guess on ${destination.name} chain guess was: ${guess}`);
        guess != 5 ? console.log('you guessed wrong!') : console.log('you guessed right!');
    }

    console.log('--- Initially ---');
    console.log(`your balance at ${source.name} is ${originalBalance.toString()}`);
    console.log(`pot balance at ${destination.name} is ${await destination.usdc.balanceOf(destination.multichainReceiver.address)}`);

    const fee = await calculateBridgeFee(source, destination);

    //approve on dest
    const destChainApproveTx = await destination.usdc.approve(destination.multichainGame.address, amount);
    await destChainApproveTx.wait();

    //approve on src
    const srcChainApproveTx = await source.usdc.approve(source.multichainGame.address, amount * 2);
    await srcChainApproveTx.wait();

    //guess incorrect on dest
    const incorrectGuessTxSameChain = await destination.multichainGame.guessNumber(
        '',
        destination.multichainReceiver.address,
        guess === 5 ? (guess = 4) : guess,
        token,
        amount,
    );
    await incorrectGuessTxSameChain.wait();
    log(guess);

    //guess incorrect 1 on src
    const incorrectGuessTxMultiChain = await source.multichainGame.guessNumber(
        destination.name,
        destination.multichainReceiver.address,
        guess != 5 ? (guess = 4) : guess,
        token,
        amount,
        { value: fee },
    );
    await incorrectGuessTxMultiChain.wait();
    log(guess);

    console.log(`pot balance is now ${await destination.usdc.balanceOf(destination.multichainReceiver.address)}`);

    //guess correct on src
    const correctGuessTxMultiChain = await source.multichainGame.guessNumber(
        destination.name,
        destination.multichainReceiver.address,
        guess != 5 ? (guess = 5) : guess,
        token,
        amount,
        {
            value: fee,
        },
    );
 await correctGuessTxMultiChain.wait();
    log(guess);

    console.log('---- AFTER CORRECT GUESS ----');
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    while (true) {
        const updatedBalance = await source.usdc.balanceOf(wallet.address);
        if (updatedBalance.gt(originalBalance)) {
            const potUpdatedBalance = await destination.usdc.balanceOf(destination.multichainReceiver.address);
            const userUpdatedBalance = await source.usdc.balanceOf(wallet.address);
            console.log(`pot balance at ${destination.name} is now ${potUpdatedBalance}`);
            console.log(`your balance at ${source.name} is now ${userUpdatedBalance}`);
            break;
        }
        await sleep(6000);

    }
}

module.exports = {
    deploy,
    execute,
};
