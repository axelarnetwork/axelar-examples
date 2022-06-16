'use strict';

const { getDefaultProvider, Contract, constants: { AddressZero } } = require('ethers');
const { deployAndInitContractConstant } = require('axelar-utils-solidity');

const Headers = require('../../build/Headers.json');
const Gateway = require('../../build/IAxelarGateway.json');
const IERC20 = require('../../build/IERC20.json');

async function deploy(chain, wallet) {
    console.log(`Deploying Headers for ${chain.name}.`);
    const contract = await deployAndInitContractConstant(
        chain.constAddressDeployer, 
        wallet, 
        Headers, 
        'headers',
        [10],
        [chain.gateway, chain.gasReceiver],
    );
    chain.headers = contract.address;
    console.log(`Deployed Headers for ${chain.name} at ${chain.headers}.`);
}

async function test(chains, wallet, options) {
    const args = options.args || [];
    const getGasPrice = options.getGasPrice;
    for(const chain of chains) {
        chain.provider = getDefaultProvider(chain.rpc);
        chain.wallet = wallet.connect(chain.provider);
        chain.contract = new Contract(chain.headers, Headers.abi, chain.wallet);
        const gateway = new Contract(chain.gateway, Gateway.abi, chain.wallet);
        const usdcAddress = await gateway.tokenAddresses('aUSDC');
        chain.usdc = new Contract(usdcAddress, IERC20.abi, chain.wallet);
    }
    const source = chains.find(chain => chain.name == (args[0] || 'Avalanche'));
    const destination = chains.find(chain =>chain.name == (args[1] || 'Fantom'));
    
    
    function sleep(ms) {
        return new Promise((resolve)=> {
            setTimeout(() => {resolve()}, ms);
        })
    }

    const gasLimit = 3e5;
    const gasPrice = await getGasPrice(source, destination, source.usdc.address);

    await (await source.usdc.approve(
        source.contract.address,
        BigInt(gasLimit * gasPrice),
    )).wait();
    
    const tx = await (await source.contract.updateRemoteHeaders(
        source.usdc.address,
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
    test,
}
