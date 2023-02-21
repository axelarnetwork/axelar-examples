import cn from 'classnames';
import type { NextPage } from 'next';
import React, { useCallback, useEffect, useState } from 'react';
import { wallet, isTestnet } from 'config/constants';
import { getBalance, truncatedAddress, depositAddressSendToken, gatewaySendToken } from 'helpers';

const SendToken: NextPage = () => {
    const [customRecipientAddress, setCustomRecipientAddress] = useState<string>('');
    const [sendMethod, setSendMethod] = useState<string>('sendToken');
    const [recipientAddress, setRecipientAddress] = useState<string>('');
    const [balances, setBalances] = useState<string[]>([]);
    const [senderBalance, setSenderBalance] = useState<string>();
    const [txhash, setTxhash] = useState<string>();
    const [loading, setLoading] = useState(false);
    const [depositAddress, setDepositAddress] = useState<string>('');
    const [transferFee, setTransferFee] = useState<number>(0);
    const [amount, setAmount] = useState<number>(0);

    async function handleOnSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const amount = formData.get('amount') as string;
        setAmount(+amount);
        setTransferFee(0);

        const send = sendMethod === 'sendToken' ? gatewaySendToken : depositAddressSendToken;

        setLoading(true);

        const cb =
            sendMethod === 'sendToken'
                ? (data: any) => {
                      setTxhash(data.txHash);
                      setTransferFee(data.transferFee);
                  }
                : (data: any) => {
                      setTxhash(data.txHash);
                      setTransferFee(data.transferFee);
                      setDepositAddress(data.depositAddress);
                  };

        await send(amount, recipientAddress, cb).finally(() => {
            setLoading(false);
            setDepositAddress('');
            handleRefreshSrcBalances();
            handleRefreshDestBalances();
        });
    }

    const handleRefreshDestBalances = useCallback(async () => {
        if (recipientAddress?.length === 0) return;
        const _balances = await getBalance([recipientAddress], false);
        setBalances(_balances);
    }, [recipientAddress]);

    const handleRefreshSrcBalances = useCallback(async () => {
        const [_balance] = await getBalance([wallet.address], true);
        setSenderBalance(_balance);
    }, []);

    const handleOnAddRecepientAddress = () => {
        setRecipientAddress(customRecipientAddress);
        setCustomRecipientAddress('');
    };

    useEffect(() => {
        handleRefreshSrcBalances();
        handleRefreshDestBalances();
    }, [handleRefreshSrcBalances, handleRefreshDestBalances]);

    return (
        <div>
            <h1 className="text-3xl font-medium text-center">{sendMethod === 'sendToken' ? 'Send Token' : 'Deposit Address'}</h1>
            <br />
            <div className="flex justify-center">
                <button
                    onClick={() => setSendMethod('sendToken')}
                    className={`m-1 btn ${sendMethod === 'sendToken' ? 'btn-primary' : 'btn-active btn-ghost'}`}
                >
                    Gateway Send Token
                </button>
                <button
                    onClick={() => setSendMethod('depositAddress')}
                    className={`m-1 btn  ${sendMethod === 'depositAddress' ? 'btn-primary' : 'btn-active btn-ghost'}`}
                >
                    Deposit Address
                </button>
            </div>

            <div className="grid grid-cols-2 gap-20 mt-5 justify-items-center">
                {/* source chain card */}
                <div className="row-span-2 shadow-xl card w-96 bg-base-100">
                    <figure
                        className="h-64 bg-center bg-no-repeat bg-cover image-full"
                        style={{ backgroundImage: "url('/assets/avalanche.gif')" }}
                    />
                    <div className="card-body">
                        <h2 className="card-title">Avalanche (Token Sender)</h2>
                        <p>
                            Sender ({truncatedAddress(wallet.address)}) balance: {senderBalance}
                        </p>
                        <div className="justify-end mt-2 card-actions">
                            <form className="flex flex-col w-full" autoComplete="off" onSubmit={handleOnSubmit}>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Moonbeam Recipient Address</span>
                                    </label>
                                    <label className="w-full input-group">
                                        <input
                                            type="text"
                                            placeholder="Enter address"
                                            className="w-full input input-bordered"
                                            value={customRecipientAddress}
                                            onChange={(e) => setCustomRecipientAddress(e.target.value)}
                                        />
                                        <button type="button" className="btn btn-primary" onClick={handleOnAddRecepientAddress}>
                                            Set
                                        </button>
                                    </label>
                                </div>
                                {recipientAddress && (
                                    <label className="label">
                                        <span className="label-text">Recipient: {truncatedAddress(recipientAddress)}</span>
                                    </label>
                                )}
                                {depositAddress && (
                                    <label className="label">
                                        <span className="label-text">Deposit Address: {truncatedAddress(depositAddress)}</span>
                                    </label>
                                )}
                                <div>
                                    <label className="label">
                                        <span className="label-text">Token amount</span>
                                    </label>
                                    <div className="w-full input-group">
                                        <input
                                            disabled={loading}
                                            required
                                            name="amount"
                                            type="number"
                                            placeholder="Enter amount to send"
                                            className="w-full input input-bordered"
                                        />
                                        <button
                                            className={cn('btn btn-primary', {
                                                loading,
                                                'opacity-30': loading || recipientAddress.length === 0,
                                                'opacity-100': !loading && recipientAddress.length > 0,
                                            })}
                                            type="submit"
                                        >
                                            Send
                                        </button>
                                    </div>
                                </div>
                                <br />
                                {txhash && transferFee && (
                                    <div>
                                        <div>Transfer fee: {transferFee}</div>
                                        <div>Net amount to send: {amount - transferFee}</div>
                                    </div>
                                )}
                                <br />
                                {txhash && isTestnet && (
                                    <button className="btn btn-accent">
                                        <a
                                            href={`https://testnet.axelarscan.io/${
                                                sendMethod === 'sendToken' ? 'sent' : 'transfer'
                                            }/${txhash}`}
                                            target="blank"
                                        >
                                            Axelarscan {sendMethod === 'sendToken' ? 'sendToken' : 'Deposit Address'} status
                                        </a>
                                    </button>
                                )}
                            </form>
                        </div>
                    </div>
                </div>

                {/* Destination chain card */}
                <div className="row-span-1 shadow-xl card w-96 bg-base-100">
                    <figure
                        className="h-64 bg-center bg-no-repeat bg-cover image-full"
                        style={{ backgroundImage: "url('/assets/moonbeam.gif')" }}
                    />
                    <div className="card-body">
                        <h2 className="card-title">Moonbeam (Token Receiver)</h2>
                        {loading ? (
                            <div role="status">
                                <svg
                                    className="inline w-8 h-8 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-gray-600 dark:fill-gray-300"
                                    viewBox="0 0 100 101"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                        fill="currentColor"
                                    />
                                    <path
                                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                        fill="currentFill"
                                    />
                                </svg>
                                <span className="sr-only">Loading...</span>
                            </div>
                        ) : (
                            recipientAddress && (
                                <div className="h-40">
                                    <div className="w-full max-w-xs form-control">
                                        <div key={recipientAddress} className="flex justify-between">
                                            <span>{truncatedAddress(recipientAddress)}</span>
                                            <span className="font-bold">{balances[0] || `0.00`}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SendToken;
