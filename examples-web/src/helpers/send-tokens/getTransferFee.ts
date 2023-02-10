import { AxelarQueryAPI, Environment } from "@axelar-network/axelarjs-sdk";
import {ethers} from "ethers"

export const getTransferFee = async (srcChain: string, destChain: string, symbol: string, amount: string) => {
    if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'local') {
        return 1;
    }

    const axelarQueryApi = new AxelarQueryAPI({ environment: Environment.TESTNET})
    const denom = await axelarQueryApi.getDenomFromSymbol(symbol, srcChain);
    if(!denom) return 1;

    const feeResponse = await axelarQueryApi.getTransferFee(srcChain, destChain, denom, ethers.utils.parseUnits(amount, 6).toNumber());
    if(!feeResponse) return 1;

    return +ethers.utils.formatUnits(feeResponse?.fee?.amount || "0", 6);
}
