import "dotenv/config";
import { getDefaultProvider, Wallet } from "ethers";
import {MessageSender__factory as CallContractWithTokenSenderFactory, MessageReceiver__factory as CallContractWithTokenReceiverFactory} from '../../src/types/factories/contracts/call-contract-with-token/contracts'

export async function deploy(wallet: Wallet, chainA: any, chainB: any) {
  // deploy on ethereum
  const providerA = getDefaultProvider(chainA.rpc);
  const providerB = getDefaultProvider(chainB.rpc);
  const walletA = wallet.connect(providerA);
  const walletB = wallet.connect(providerB);

  const callContractWithTokenSenderFactory = new CallContractWithTokenSenderFactory(walletA)
  const callContractWithTokenReceiverFactory = new CallContractWithTokenReceiverFactory(walletB)

  const callContractWithTokenSender = await callContractWithTokenSenderFactory.deploy(chainA.gateway, chainA.gasService)
  const callContractWithTokenReceiver = await callContractWithTokenReceiverFactory.deploy(chainB.gateway, chainB.gasService)

  chainA.callContractWithToken = callContractWithTokenSender.address;
  chainB.callContractWithToken = callContractWithTokenReceiver.address;

  return [chainA, chainB]
}
