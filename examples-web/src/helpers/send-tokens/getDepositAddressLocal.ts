import { keccak256, id } from 'ethers/lib/utils';
import { Wallet } from 'ethers';

const depositAddresses: any = {};

export function getDepositAddressLocal(
    from: any | string,
    to: any | string,
    destinationAddress: string,
    symbol: string,
    port: number | undefined = undefined,
) {
    if (typeof from !== 'string') from = from.name;
    if (typeof to !== 'string') to = to.name;

    if (!port) {
        const key = keccak256(id(from + ':' + to + ':' + destinationAddress + ':' + symbol));
        const address = new Wallet(key).address;
        depositAddresses[from] = {
            [address]: {
                destinationChain: to,
                destinationAddress,
                tokenSymbol: symbol,
                privateKey: key,
            },
        };
        return address;
    }

    const url = `http://localhost:${port}/getDepositAddress/${from}/${to}/${destinationAddress}/${symbol}`;
    return new Promise((resolve, reject) => {
        fetch(url)
            .then((res) => res.json())
            .then((data) => resolve(data));
    });
}
