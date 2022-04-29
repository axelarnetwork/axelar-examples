'use strict';

const { getDefaultProvider, Contract, constants: { AddressZero } } = require('ethers');
const { utils: { deployContract }} = require('@axelar-network/axelar-local-dev');

const Headers = require('../../build/Headers.json');
const Gateway = require('../../build/IAxelarGateway.json');
const IERC20 = require('../../build/IERC20.json');

async function deploy(chain, wallet) {
    console.log(`Deploying Headers for ${chain.name}.`);
    const contract = await deployContract(wallet, Headers, [chain.gateway, chain.gasReceiver, 10]);
    chain.headers = contract.address;
    console.log(`Deployed Headers for ${chain.name} at ${chain.executableSample}.`);
}
async function postDeploy(chain, chains, wallet) {
    const contract = new Contract(chain.headers, Headers.abi, wallet);
    for(const otherChain of chains) {
        if(chain == otherChain) continue;
        console.log(`Linking ${chain.name} -> ${otherChain.name}.`);
        await (await contract.addSibling(otherChain.name, otherChain.headers)).wait();
        console.log(`Linked ${chain.name} -> ${otherChain.name}.`);
    }
}

async function test(chains, wallet, options) {
    const args = options.args || [];
    const getGasPrice = options.getGasPrice;
    for(const chain of chains) {
        chain.provider = getDefaultProvider(chain.rpc);
        chain.wallet = wallet.connect(chain.provider);
        chain.contract = new Contract(chain.headers, Headers.abi, chain.wallet);
        const gateway = new Contract(chain.gateway, Gateway.abi, chain.wallet);
        const ustAddress = await gateway.tokenAddresses('UST');
        chain.ust = new Contract(ustAddress, IERC20.abi, chain.wallet);
    }
    const source = chains.find(chain => chain.name == (args[0] || 'Avalanche'));
    const destination = chains.find(chain =>chain.name == (args[1] || 'Fantom'));
    
    
    function sleep(ms) {
        return new Promise((resolve)=> {
            setTimeout(() => {resolve()}, ms);
        })
    }



    //Set the gasLimit to 1e6 (a safe overestimate) and get the gas price (this is constant and always 1).
    const gasLimit = 3e5;
    const gasPrice = await getGasPrice(source, destination, source.ust.address);

    await (await source.ust.approve(
        source.contract.address,
        BigInt(gasLimit * gasPrice),
    )).wait();
    
    // Set the value on chain1. This will also cause the value on chain2 to change after relay() is called.
    const tx = await (await source.contract.updateRemoteHeaders(
        source.ust.address,
        [destination.name],
        [BigInt(gasLimit * gasPrice)],
    )).wait();
    const hash = (await source.provider.getBlock(tx.blockNumber-1)).hash;
    
    while(true) {
        try{
            const remoteHash = await destination.contract.getHeader(source.name, 0);
            if(remoteHash.header_ == hash && tx.blockNumber-1 == remoteHash.block_) break;
            await sleep(2000);
        } catch (e) {
            await sleep(2000);
        }
    }

    console.log('Success!');
}

module.exports = {
    deploy,
    postDeploy,
    test,
}
