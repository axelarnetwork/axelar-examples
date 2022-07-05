import cn from 'classnames';
import type { NextPage } from 'next';
import React, { useState } from 'react';
import { sendMessageToAvalanche, getAvalancheMessage } from '../utils';

const Home: NextPage = () => {
    const [msg, setMsg] = useState<string>('');
    const [loading, setLoading] = useState(false);

    async function handleOnSubmitMessage(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        setLoading(true);
        await sendMessageToAvalanche(formData.get('message') as string).finally(() => {
            setLoading(false);
        });
    }

    async function handleOnGetMessage() {
        const _msg = await getAvalancheMessage();
        setMsg(_msg);
    }

    return (
        <div>
            <div>
                <h1 className="text-4xl font-medium text-center">General Message Passing (GMP)</h1>

                <div className="grid grid-cols-2 gap-20 mt-20 justify-items-center">
                    <div className="shadow-xl card w-96 bg-base-100">
                        <figure
                            className="h-64 bg-center bg-no-repeat bg-cover image-full"
                            style={{ backgroundImage: "url('/assets/ethereum.gif')" }}
                        />
                        <div className="card-body">
                            <h2 className="card-title">Ethereum (Message Sender)</h2>
                            <p>Send a cross-chain message</p>
                            <div className="justify-end card-actions">
                                <form className="flex w-full" onSubmit={handleOnSubmitMessage}>
                                    <input
                                        disabled={loading}
                                        required
                                        minLength={3}
                                        name="message"
                                        type="text"
                                        placeholder="Enter your message"
                                        className="w-full max-w-xs input input-bordered"
                                    />
                                    <button
                                        className={cn('btn btn-primary ml-2', {
                                            loading,
                                        })}
                                        type="submit"
                                    >
                                        Send
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                    <div className="shadow-xl card w-96 bg-base-100">
                        <figure
                            className="h-64 bg-center bg-no-repeat bg-cover image-full"
                            style={{ backgroundImage: "url('/assets/avalanche.gif')" }}
                        />
                        <div className="card-body">
                            <h2 className="card-title">Avalanche (Message Receiver)</h2>
                            <div>
                                <label>Message</label>
                                <div>{msg}</div>
                            </div>
                            <div className="justify-end card-actions" onClick={handleOnGetMessage}>
                                <button className="btn btn-primary">Refresh Contract</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
