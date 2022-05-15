const { Contract, ContractFactory, constants: { AddressZero }, utils: { keccak256, defaultAbiCoder } } = require('ethers');
const axios = require('axios');
const axelarLocal = require('@axelar-network/axelar-local-dev');

const {
    AxelarAssetTransfer
} = require("@axelar-network/axelarjs-sdk");
const ConstAddressDeployer = require('../build/ConstAddressDeployer.json');

function getDepositAddress(env, source, destination, destinationAddress, symbol) {
    if(env == 'testnet') {
        const listing = {
            'USDC': 'uusdc',
        }
        const sdk = new AxelarAssetTransfer({
            environment: 'testnet',
            auth: "local",
        });
        return sdk.getDepositAddress(source, destination, destinationAddress, listing[symbol]);
    } else {
        return axelarLocal.getDepositAddress(source, destination, destinationAddress, symbol, 8500);
    }
}

async function getGasPrice(env, source, destination, tokenAddress) {
    if(env == 'local') return 1;
    if(env != 'testnet') throw Error('env needs to be "local" or "testnet".');
    const api_url ='https://devnet.api.gmp.axelarscan.io';

    const requester = axios.create({ baseURL: api_url });
        const params = {
        method: 'getGasPrice',
        destinationChain: destination.name,
        sourceChain: source.name,
    };

    // set gas token address to params
    if (tokenAddress != AddressZero) {
        params.sourceTokenAddress = tokenAddress;
    }
    else {
        params.sourceTokenSymbol = source.tokenSymbol;
    }
      // send request
    const response = await requester.get('/', { params })
        .catch(error => { return { data: { error } }; });
    const result = response.data.result;
    const dest = result.destination_native_token;
    const destPrice = 1e18*dest.gas_price*dest.token_price.usd;
    return destPrice / result.source_token.token_price.usd;
}
function getSaltFromKey(key) {
    return keccak256(defaultAbiCoder.encode(['string'], [key]));
}
async function deployContractConstant(deployerContractAddress, wallet, contract, key, args = []) {
    const deployerContract = new Contract(deployerContractAddress, ConstAddressDeployer.abi, wallet);
    const salt = getSaltFromKey(key);
    const factory = new ContractFactory(
        contract.abi,
        contract.bytecode
    );
    const bytecode = (await factory.getDeployTransaction(...args)).data;
    await (await deployerContract.connect(wallet).deploy(bytecode, salt)).wait();
    const address = await deployerContract.predict(bytecode, salt);
    return new Contract(address, contract.abi, wallet);
  };
  async function predictContractConstant (deployerContractAddress, wallet, contract, key, args = []) {
    const deployerContract = new Contract(deployerContractAddress, ConstAddressDeployer.abi, wallet);
    const salt = getSaltFromKey(key);
    const factory = new ContractFactory(
        contract.abi,
        contract.bytecode
    );
    const bytecode = (await factory.getDeployTransaction(...args)).data;
    return await deployerContract.predict(bytecode, salt);
  };

module.exports = {
    getGasPrice,
    getDepositAddress,
    deployContractConstant,
    predictContractConstant,
}