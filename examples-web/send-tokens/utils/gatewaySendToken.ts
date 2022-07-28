import { Contract, ethers, getDefaultProvider, providers } from 'ethers';
import { AxelarAssetTransfer, AxelarQueryAPI, Environment, EvmChain, GasToken } from '@axelar-network/axelarjs-sdk';

import AxelarGatewayContract from '../abi/IAxelarGateway.sol/IAxelarGateway.json';
import IERC20 from '../abi/IERC20.sol/IERC20.json';
import { isTestnet, wallet } from '../config/constants';
import { sleep } from './sleep';
import { getTransferFee } from './getTransferFee';

let chains = isTestnet ? require('../config/testnet.json') : require('../config/local.json');

const moonbeamChain = chains.find((chain: any) => chain.name === 'Moonbeam') as any;
const avalancheChain = chains.find((chain: any) => chain.name === 'Avalanche') as any;

if (!moonbeamChain || !avalancheChain) process.exit(0);

const useMetamask = false; // typeof window === 'object';

const moonbeamProvider = useMetamask ? new providers.Web3Provider((window as any).ethereum) : getDefaultProvider(moonbeamChain.rpc);
const moonbeamConnectedWallet = useMetamask ? (moonbeamProvider as providers.Web3Provider).getSigner() : wallet.connect(moonbeamProvider);
const avalancheProvider = getDefaultProvider(avalancheChain.rpc);
const avalancheConnectedWallet = wallet.connect(avalancheProvider);

const srcGatewayContract = new Contract(avalancheChain.gateway, AxelarGatewayContract.abi, avalancheConnectedWallet);
const destGatewayContract = new Contract(moonbeamChain.gateway, AxelarGatewayContract.abi, moonbeamConnectedWallet);

export async function gatewaySendToken(
    amount: string,
    recipientAddress: string,
    onSent: (data: { txHash: string; transferFee: number }) => void
) {
    // Get token address from the gateway contract for the src chain
    const srcTokenAddress = await srcGatewayContract.tokenAddresses('aUSDC');
    const srcErc20 = new Contract(srcTokenAddress, IERC20.abi, avalancheConnectedWallet);

    // Get token address from the gateway contract for the destination chain
    const destinationTokenAddress = await destGatewayContract.tokenAddresses('aUSDC');
    const destERC20 = new Contract(destinationTokenAddress, IERC20.abi, moonbeamConnectedWallet);

    const destBalance = await destERC20.balanceOf(recipientAddress);

    const transferFee: number = await getTransferFee('avalanche', 'moonbeam', 'aUSDC', amount);

    // Approve the token for the amount to be sent
    await srcErc20.approve(srcGatewayContract.address, ethers.utils.parseUnits(amount, 6)).then((tx: any) => tx.wait());

    // Send the token
    const txHash: string = await srcGatewayContract
        .sendToken('Moonbeam', recipientAddress, 'aUSDC', ethers.utils.parseUnits(amount, 6))
        .then((tx: any) => tx.wait())
        .then((receipt: any) => receipt.transactionHash);

    console.log({ txHash });
    onSent({ txHash, transferFee });

    // Wait destination contract to execute the transaction.
    return new Promise(async (resolve, reject) => {
        while (true) {
            const newBalance = await destERC20.balanceOf(recipientAddress);
            if (BigInt(destBalance) != BigInt(newBalance)) break;
            await sleep(2000);
        }
        resolve(null);
    });
}
