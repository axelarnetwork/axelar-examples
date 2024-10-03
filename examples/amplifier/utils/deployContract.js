const { ContractFactory, Wallet, providers } = require('ethers');
const AmplifierGMPTest = require('../../../artifacts/examples/amplifier/contracts/AmplifierGMPTest.sol/AmplifierGMPTest.json');
const { getConfig } = require('../config/config');

const config = getConfig().chains;

const deploy = async (chainName) => {
    const chain = config.find((chain) => chain.name === chainName);
    const signer = new Wallet(process.env.EVM_PRIVATE_KEY, new providers.JsonRpcProvider(chain.rpc));
    const factory = new ContractFactory(AmplifierGMPTest.abi, AmplifierGMPTest.bytecode, signer);
    console.log(`Deploying ${AmplifierGMPTest.contractName} on ${chain.name}`);
    return factory.deploy(chain.gateway);
};

module.exports = {
    deploy,
};
