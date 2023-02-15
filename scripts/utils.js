const {
    constants: { AddressZero },
    Wallet
} = require('ethers');
const axios = require('axios');
const axelarLocal = require('@axelar-network/axelar-local-dev');

const { AxelarAssetTransfer } = require('@axelar-network/axelarjs-sdk');

function getWallet() {
  const privateKey = process.env.EVM_PRIVATE_KEY;
  return privateKey ? new Wallet(privateKey) : Wallet.fromMnemonic(process.env.EVM_MNEMONIC);
}

function getDepositAddress(env, source, destination, destinationAddress, symbol) {
    if (env === 'testnet') {
        const listing = {
            aUSDC: 'uusdc',
        };
        const sdk = new AxelarAssetTransfer({
            environment: 'testnet',
            auth: 'local',
        });
        return sdk.getDepositAddress(source, destination, destinationAddress, listing[symbol]);
    }

    return axelarLocal.getDepositAddress(source, destination, destinationAddress, symbol, 8500);
}

async function getGasPrice(env, source, destination, tokenAddress) {
    if (env === 'local') return 1;
    if (env !== 'testnet' && env !== 'sandbox') throw Error('env needs to be "local" or "testnet".');
    const apiUrl = 'https://devnet.api.gmp.axelarscan.io';

    const requester = axios.create({ baseURL: apiUrl });
    const params = {
        method: 'getGasPrice',
        destinationChain: destination.name,
        sourceChain: source.name,
    };

    // set gas token address to params
    if (tokenAddress !== AddressZero) {
        params.sourceTokenAddress = tokenAddress;
    } else {
        params.sourceTokenSymbol = source.tokenSymbol;
    }

    // send request
    const response = await requester.get('/', { params }).catch((error) => {
        return { data: { error } };
    });
    const result = response.data.result;
    const dest = result.destination_native_token;
    const destPrice = 1e18 * dest.gas_price * dest.token_price.usd;
    return destPrice / result.source_token.token_price.usd;
}

module.exports = {
    getWallet,
    getGasPrice,
    getDepositAddress,
};
