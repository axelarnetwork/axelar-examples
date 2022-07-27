import cn from 'classnames';
import type { NextPage } from 'next';
import React, { useCallback, useEffect, useState } from 'react';
import { wallet, isTestnet } from '../config/constants';
import { getBalance, truncatedAddress, depositAddressSendToken, gatewaySendToken } from '../utils';

const Home: NextPage = () => {
    const [customRecipientAddress, setCustomRecipientAddress] = useState<string>('');
    const [sendMethod, setSendMethod] = useState<string>('sendToken');
    const [recipientAddress, setRecipientAddress] = useState<string>('');
    const [balances, setBalances] = useState<string[]>([]);
    const [senderBalance, setSenderBalance] = useState<string>();
    const [txhash, setTxhash] = useState<string>();
    const [loading, setLoading] = useState(false);

    async function handleOnSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const amount = formData.get('amount') as string;

        const cb = sendMethod === "sendToken" ? gatewaySendToken : depositAddressSendToken;

        setLoading(true);

        await cb(amount, recipientAddress, setTxhash).finally(() => {
            setLoading(false);
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
            <div>
                <h1 className="text-4xl font-medium text-center">{sendMethod === 'sendToken' ? 'Send Token' : 'Deposit Address'} Demo</h1>
                <br />
                <div className="flex justify-center">
                    <button
                        onClick={() => setSendMethod('sendToken')}
                        className={`m-1 btn ${sendMethod === 'sendToken' ? 'btn-primary' : ''}`}
                    >
                        Gateway Send Token
                    </button>
                    <button
                        onClick={() => setSendMethod('depositAddress')}
                        className={`m-1 btn ${sendMethod === 'depositAddress' ? 'btn-primary' : ''}`}
                    >
                        Deposit Address
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-20 mt-20 justify-items-center">
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
                                <form className="flex flex-col w-full" onSubmit={handleOnSubmit}>
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
                                    <label className="label">
                                        <span className="label-text">Recipient: {truncatedAddress(recipientAddress)}</span>
                                    </label>
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
                                    {txhash && isTestnet && (
                                        <a
                                            href={`https://testnet.axelarscan.io/${sendMethod === "sendToken" ? "sent" : "transfer"}/${txhash}`}
                                            className="mt-2 link link-accent"
                                            target="blank"
                                        >
                                            Track Transfer Status on Axelarscan
                                        </a>
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
                            <div className="h-40">
                                <div className="w-full max-w-xs form-control">
                                    <div key={recipientAddress} className="flex justify-between">
                                        <span>{truncatedAddress(recipientAddress)}</span>
                                        <span className="font-bold">{balances[0] || `0.00`}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
