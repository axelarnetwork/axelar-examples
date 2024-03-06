import "dotenv/config";
import { getDefaultProvider, Wallet } from "ethers";
import { CallContractWithToken__factory as CallContractWithTokenFactory } from '../../src/types/factories/contracts/call-contract-with-token/contracts'

export async function deploy(wallet: Wallet, chainA: any, chainB: any) {
  // deploy on ethereum
  const providerA = getDefaultProvider(chainA.rpc);
  const providerB = getDefaultProvider(chainB.rpc);
  const walletA = wallet.connect(providerA);
  const walletB = wallet.connect(providerB);

  const callContractWithTokenSrcFactory = new CallContractWithTokenFactory(walletA)
  const callContractWithTokenDestFactory = new CallContractWithTokenFactory(walletB)

  const callContractWithTokenSrc = await callContractWithTokenSrcFactory.deploy(chainA.gateway, chainA.gasService)
  const callContractWithTokenDest = await callContractWithTokenDestFactory.deploy(chainB.gateway, chainB.gasService)

  chainA.callContractWithToken = callContractWithTokenSrc.address;
  chainB.callContractWithToken = callContractWithTokenDest.address;

  return [chainA, chainB]
}
