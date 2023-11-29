'use strict';

const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');
const { Contract } = require('ethers');
const { keccak256, defaultAbiCoder } = require('ethers/lib/utils');

const CustomToken = rootRequire('./artifacts/examples/evm/its-custom-token/CustomToken.sol/CustomToken.json');
const ITokenManager = rootRequire('./artifacts/@axelar-network/interchain-token-service/contracts/interfaces/ITokenManager.sol/ITokenManager.json');
const MINT_BURN = 0;

async function deploy(chain, wallet) {
    console.log(`Deploying CustomToken for ${chain.name}.`);
    chain.customToken = await deployContract(wallet, CustomToken, ['Custon Token', 'CT', 18]);
    chain.wallet = wallet;
    console.log(`Deployed CustomToken for ${chain.name} at ${chain.customToken.address}.`);

    const salt = keccak256(chain.customToken.address);
    console.log(`Registering custom token at ${chain.customToken.address} using ${salt} as the salt`);
    const params = defaultAbiCoder.encode(['bytes', 'address'], [wallet.address, chain.customToken.address]);
    await (await chain.interchainTokenService.deployTokenManager(salt, '', MINT_BURN, params, 0)).wait();
    const tokenId = await chain.interchainTokenService.interchainTokenId(wallet.address, salt);
    const tokenManagerAddress = await chain.interchainTokenService.tokenManagerAddress(tokenId);
    chain.customTokenManager = new Contract(tokenManagerAddress, ITokenManager.abi, wallet.address);

    console.log(`Registered custom token at ${chain.customToken.address} and got a token manager at ${tokenManagerAddress}`);

}

async function execute(chains, wallet, options) {
    const args = options.args || [];
    const { source, destination, calculateBridgeFee } = options;
    const message = args[2] || `Hello ${destination.name} from ${source.name}, it is ${new Date().toLocaleTimeString()}.`;

    async function logValue() {
        console.log(`value at ${destination.name} is "${await destination.contract.value()}"`);
    }

    console.log('--- Initially ---');
    await logValue();

    const fee = await calculateBridgeFee(source, destination);

    const tx = await source.contract.setRemoteValue(destination.name, destination.contract.address, message, {
        value: fee,
    });
    await tx.wait();

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    while ((await destination.contract.value()) !== message) {
        await sleep(1000);
    }

    console.log('--- After ---');
    await logValue();
}

module.exports = {
    deploy,
    execute,
};


(async () => {

const TokenManagerType_MINT_BURN = 0;

async function main() {

  const itsFactory = await ethers.getContractFactory('InterchainTokenService');
  const tokenManagerFactory = await ethers.getContractFactory('TokenManagerMintBurn');
  const RMRKFactory = await ethers.getContractFactory('RMRK');

  const its = itsFactory.attach('0xa4A9965149388c86E62CDDDd6C95EFe9c294005a')
  
  const deployer = (await ethers.getSigners())[0];
  console.log('Deploying Token Manager with the account:', deployer.address);

  const tokenManagerImplementationAddress = await its.tokenManagerImplementation(
    TokenManagerType_MINT_BURN,
  );
  console.log('Token Manager Implementation', tokenManagerImplementationAddress);
  const tokenManagerImplementation = tokenManagerFactory.attach(tokenManagerImplementationAddress);

  const salt = ethers.utils.id('RMRK');
  const tokenId = await its.interchainTokenId(deployer.address, salt);
  const params = await tokenManagerImplementation.params(deployer.address, '0x44950583ed6e313f2A13c73211D8039226f82429');
  console.log('Token ID', tokenId);
  console.log('Params', params);

  let tx = await its.deployTokenManager(salt, '', TokenManagerType_MINT_BURN, params, 0);
  await tx.wait();
  console.log('Deployed Token Manager');
  const tokenManagerAddress = await its.tokenManagerAddress(tokenId);
  console.log('Deployed Token Manager to ', tokenManagerAddress);

  await rmrk.setTokenManager(tokenManagerAddress);

  tx = await rmrk.grantRole(ethers.utils.id('MINTER_ROLE'), tokenManagerAddress);
  await tx.wait();
  tx = await rmrk.grantRole(ethers.utils.id('BURNER_ROLE'), tokenManagerAddress);
  await tx.wait();
  console.log('Granted MINTER_ROLE and BURNER_ROLE to ', tokenManagerAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

})();