const { ethers } = require("ethers")
const {privateKey} = '../../secret.json'
const localChainData = '../../local.json'

const deployContract = async (contractAbi, chains) => {
  if(!privateKey) return console.log("Required `secret.json` with your private key.")
  if(!localChainData) return console.log("`yarn start-local` must be run before execute this")

  for(const chain of chains) {
    const {rpc, gasReceiver, gateway} = chains[chain]
    const provider = ethers.getDefaultProvider(rpc);
    const deployer = new Wallet(privateKey, provider)

    const contract = await deployContract(
      deployer,
      contractAbi,
      [gateway, gasReceiver]
    );

    console.log("Deployed:", contract.address);
  }
}

module.exports = {
  deployContract
}
