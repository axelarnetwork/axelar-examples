import { Contract, ethers, getDefaultProvider, providers } from 'ethers';
import {IERC20__factory as IERC20, IAxelarGateway__factory as IAxelarGateway} from 'types/contracts/factories/@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces'
import { isTestnet, wallet } from 'config/constants';
import { sleep } from './sleep';
import { getTransferFee } from './getTransferFee';

const chains = isTestnet
  ? require("../../../../../config/testnet.json")
  : require("../../../../../config/chains.json");

const ethereum = chains.find((chain: any) => chain.name === 'Ethereum') as any;
const avalanche = chains.find((chain: any) => chain.name === 'Avalanche') as any;

if (!ethereum || !avalanche) process.exit(0);

const useMetamask = false; // typeof window === 'object';

const ethereumProvider = useMetamask ? new providers.Web3Provider((window as any).ethereum) : getDefaultProvider(ethereum.rpc);
const ethereumConnectedWallet = useMetamask ? (ethereumProvider as providers.Web3Provider).getSigner() : wallet.connect(ethereumProvider);
const avalancheProvider = getDefaultProvider(avalanche.rpc);
const avalancheConnectedWallet = wallet.connect(avalancheProvider);

const srcGatewayContract = IAxelarGateway.connect(ethereum.gateway, ethereumConnectedWallet);
const destGatewayContract = IAxelarGateway.connect(avalanche.gateway, avalancheConnectedWallet);

export async function gatewaySendToken(
    amount: string,
    recipientAddress: string,
    onSent: (data: { txHash: string; transferFee: number }) => void,
) {
    // Get token address from the gateway contract for the src chain
    const srcTokenAddress = await srcGatewayContract.tokenAddresses('aUSDC');
    const srcErc20 = new Contract(srcTokenAddress, IERC20.abi, ethereumConnectedWallet);

    // Get token address from the gateway contract for the destination chain
    const destinationTokenAddress = await destGatewayContract.tokenAddresses('aUSDC');
    const destERC20 = new Contract(destinationTokenAddress, IERC20.abi, avalancheConnectedWallet);

    const destBalance = await destERC20.balanceOf(recipientAddress);

    const transferFee: number = await getTransferFee('ethereum', 'avalanche', 'aUSDC', amount);

    // Approve the token for the amount to be sent
    await srcErc20.approve(srcGatewayContract.address, ethers.utils.parseUnits(amount, 6)).then((tx: any) => tx.wait());

    // Send the token
    const txHash: string = await srcGatewayContract
        .sendToken('Avalanche', recipientAddress, 'aUSDC', ethers.utils.parseUnits(amount, 6))
        .then((tx: any) => tx.wait())
        .then((receipt: any) => receipt.transactionHash);

    onSent({ txHash, transferFee });

    // Wait destination contract to execute the transaction.
    while (true) {
        const newBalance = await destERC20.balanceOf(recipientAddress);
        if (BigInt(destBalance) !== BigInt(newBalance)) break;
        await sleep(2000);
    }
}
