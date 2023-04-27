import "dotenv/config";
import { getDefaultProvider, Wallet } from "ethers";
import {MessageSender__factory as CallContractSenderFactory, MessageReceiver__factory as CallContractReceiverFactory} from '../../src/types/factories/contracts/call-contract'

export async function deploy(wallet: Wallet, chainA: any, chainB: any) {
  // deploy on ethereum
  const providerA = getDefaultProvider(chainA.rpc);
  const providerB = getDefaultProvider(chainB.rpc);
  const walletA = wallet.connect(providerA);
  const walletB = wallet.connect(providerB);

  const callContractSenderFactory = new CallContractSenderFactory(walletA)
  const callContractReceiverFactory = new CallContractReceiverFactory(walletB)

  const callContractSender = await callContractSenderFactory.deploy(chainA.gateway, chainA.gasService)
  const callContractReceiver = await callContractReceiverFactory.deploy(chainB.gateway, chainB.gasService)

  chainA.callContract = callContractSender.address;
  chainB.callContract = callContractReceiver.address;

  return [chainA, chainB]
}
