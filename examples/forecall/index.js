'use strict';

const { getDefaultProvider, Contract, constants: { AddressZero } } = require('ethers');
const { deployAndInitContractConstant } = require('axelar-utils-solidity');

const DistributionForecallable = require('../../build/DistributionForecallable.json');
const Gateway = require('../../build/IAxelarGateway.json');
const IERC20 = require('../../build/IERC20.json');
const { defaultAbiCoder, keccak256 } = require('ethers/lib/utils');

async function deploy(chain, wallet) {
    console.log(`Deploying DistributionForecallable for ${chain.name}.`);
    const contract = await deployAndInitContractConstant(
        chain.constAddressDeployer, 
        wallet, 
        DistributionForecallable, 
        'forecallable',
        [],
        [chain.gateway, chain.gasReceiver],
    );
    chain.distributionForecallable = contract.address;
    console.log(`Deployed DistributionForecallable for ${chain.name} at ${chain.distributionForecallable}.`);
}


async function test(chains, wallet, options) {
    const args = options.args || [];
    const source = chains.find(chain => chain.name == (args[0] || 'Avalanche'));
    const destination = chains.find(chain =>chain.name == (args[1] || 'Fantom'));
    const amount = Math.floor(parseFloat(args[2]))*1e6 || 10e6;
    const accounts = args.slice(3);
    if(accounts.length == 0)
        accounts.push('0xe7490F73133dfE46D9734B1963EBe00Cb656Ed47');
    for(const chain of [source, destination]) {
        const provider = getDefaultProvider(chain.rpc);
        chain.wallet = wallet.connect(provider);
        chain.contract = new Contract(chain.distributionForecallable, DistributionForecallable.abi, chain.wallet);
        chain.gateway = new Contract(chain.gateway, Gateway.abi, chain.wallet);
        const usdcAddress = chain.gateway.tokenAddresses('aUSDC');
        chain.usdc = new Contract(usdcAddress, IERC20.abi, chain.wallet);
    }
    
    async function print() {
        console.log(`Forecaller ${wallet.address} has ${await destination.usdc.balanceOf(wallet.address)/1e6} aUSDC`);
        for(const account of accounts) {
            console.log(`${account} has ${await destination.usdc.balanceOf(account)/1e6} aUSDC`)
        }
    }
    function sleep(ms) {
        return new Promise((resolve)=> {
            setTimeout(() => {resolve()}, ms);
        })
    }

    console.log('--- Initially ---');
    await print();

    const num = BigInt(1);
    const denom = BigInt(10);
    const time = BigInt(new Date().getTime()) % (1n << 128n);
    const feePercent = num + (denom << 64n) + (time << 128n);
    const payload = defaultAbiCoder.encode(['uint256', 'address[]'], [feePercent, accounts]);
    const axelarFee = 1e6;

    await (await source.usdc.approve(
        source.contract.address,
        amount,
    )).wait();
    await (await source.contract.sendToManyForecall(
        destination.name,
        accounts, 
        'aUSDC',
        amount,
        1,
        10,
        time
    )).wait();

    const forecallAmount = await destination.contract.amountPostFee(amount - axelarFee, payload);
    await (await destination.usdc.approve(
        destination.contract.address,
        forecallAmount,
    )).wait();
    await (await destination.contract.forecallWithToken(
        source.name,
        source.distributionForecallable,
        payload,
        'aUSDC',
        amount - axelarFee,
        wallet.address,
    )).wait();

        
    console.log('--- After forecall but before execution ---');
    await print();
    
    const filter = destination.gateway.filters.ContractCallApprovedWithMint(
        null,
        null,
        null,
        destination.contract.address,
        keccak256(payload)
    )
    let validated;
    while (true) {
        validated = (await destination.gateway.queryFilter(filter))[0];
        if(validated) break;
        await sleep(1000);
    }
    const tx = await (await destination.contract.executeWithToken(
        validated.args.commandId,
        source.name,
        source.distributionForecallable,
        payload,
        'aUSDC',
        amount - axelarFee
    )).wait();
    console.log('--- After a execution ---');
    await print();
}

module.exports = {
    deploy,
    test,
}
