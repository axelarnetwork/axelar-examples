import "dotenv/config";
import { getDefaultProvider, Wallet } from "ethers";
import {CallContract__factory as CallContractFactory } from '../../src/types/factories/contracts/call-contract'

export async function deploy(wallet: Wallet, chainA: any, chainB: any) {
  // deploy on ethereum
  const providerA = getDefaultProvider(chainA.rpc);
  const providerB = getDefaultProvider(chainB.rpc);
  const walletA = wallet.connect(providerA);
  const walletB = wallet.connect(providerB);

  const callContractSenderFactory = new CallContractFactory(walletA)
  const callContractReceiverFactory = new CallContractFactory(walletB)

  const callContractSender = await callContractSenderFactory.deploy(chainA.gateway, chainA.gasService)
  const callContractReceiver = await callContractReceiverFactory.deploy(chainB.gateway, chainB.gasService)

  chainA.callContract = callContractSender.address;
  chainB.callContract = callContractReceiver.address;

  return [chainA, chainB]
}
