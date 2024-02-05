const IERC20 = require('@axelar-network/axelar-gmp-sdk-solidity/artifacts/contracts/interfaces/IERC20.sol/IERC20.json');

const { IInterchainTokenService } = require('@axelar-network/axelar-local-dev/dist/contracts');
const { Contract } = require('ethers');

async function interchainTransfer(source, destination, wallet, tokenId, amount, fee) {
    const sourceIts = new Contract(source.interchainTokenService, IInterchainTokenService.abi, wallet.connect(source.provider));
    const destinationIts = new Contract(destination.interchainTokenService, IInterchainTokenService.abi, wallet.connect(destination.provider));
    const tokenAddress = await destinationIts.validTokenAddress(tokenId);
    const destinationToken = new Contract(tokenAddress, IERC20.abi, destination.provider);
    let balance;
    async function logValue() {
        balance = await destinationToken.balanceOf(wallet.address);
        console.log(`Balance at ${destination.name} is ${balance}`);
    }

    console.log('--- Initially ---');
    await logValue();

    console.log(`Sending ${amount} of token ${tokenAddress} to ${destination.name}`);

    const tx = await sourceIts.interchainTransfer(tokenId, destination.name, wallet.address, amount, '0x', fee, {
        value: fee,
    });
    await tx.wait();

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    while (Number(balance) == Number(await destinationToken.balanceOf(wallet.address))) {
        await sleep(1000);
    }

    console.log('--- After ---');
    await logValue();
}

module.exports = {
    interchainTransfer,
}