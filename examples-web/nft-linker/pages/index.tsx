import cn from 'classnames';
import type { NextPage } from 'next';
import React, { useEffect, useState } from 'react';
import { isTestnet } from '../config/constants';
import { sendNftToDest, sendNftBack, ownerOf } from '../utils';

const chains = isTestnet ? require('../config/testnet.json') : require('../config/local.json');

const Home: NextPage = () => {
    const [txhash, setTxhash] = useState<string>();
    const [destTxHash, setDestTxHash] = useState<string>();
    const [loading, setLoading] = useState(false);
    const [owner, setOwner] = useState({});

    useEffect(() => {
      ownerOf().then(owner => setOwner(owner))
    }, [setOwner]);

    async function handleSendSource(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const onSent = (txhash: string, owner: any) => {
            setTxhash(txhash);
            setOwner(owner);
            setLoading(false);
        };
        await sendNftToDest(onSent);
    }

    async function handleSendBack(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const onSent = (txhash: string, owner: any) => {
            setDestTxHash(txhash);
            setOwner(owner);
            setLoading(false);
        };
        await sendNftBack(onSent);
    }

    return (
        <div>
            <div>
                <h1 className="m-10 text-4xl font-medium text-center">General Message Passing (GMP)</h1>
                <h2 className="m-10 text-2xl font-medium text-center">Send NFTs Between Chains</h2>

                <div className="grid grid-cols-2 gap-20 mt-20 justify-items-center">
                    {/* source chain card */}
                    {generateCard(
                        txhash as string,
                        chains.find((chain: any) => chain.name === 'Avalanche'),
                        handleSendSource,
                        'Send',
                        loading,
                        owner
                    )}

                    {/* Destination chain card */}
                    {generateCard(
                        destTxHash as string,
                        chains.find((chain: any) => chain.name === 'Moonbeam'),
                        handleSendBack,
                        'Send Back',
                        loading,
                        owner
                    )}
                </div>
            </div>
        </div>
    );
};

const generateCard = (txhash: string, chain: any, onSubmit: any, buttonTitle: string, loading: boolean, owner: any) => {
    return (
        <div className="row-span-2 shadow-xl card w-96 bg-base-100">
            <figure
                className="h-64 bg-center bg-no-repeat bg-cover image-full"
                style={{ backgroundImage: `url('/assets/${chain.name}.gif')` }}
            />
            <div className="card-body">
                <h2 className="card-title">{chain.name}</h2>

                <div className="justify-end mt-2 card-actions">
                    <form className="flex flex-col w-full" onSubmit={onSubmit}>
                        <div>
                            <div className="w-full input-group">
                                <button
                                    className={cn('btn btn-primary', {
                                        loading,
                                        'opacity-30': loading || owner.chain !== chain.name,
                                        'opacity-100': !loading && owner.chain === chain.name,
                                    })}
                                    type="submit"
                                >
                                    {buttonTitle}
                                </button>
                            </div>
                        </div>
                        {txhash && isTestnet && (
                            <a href={`https://testnet.axelarscan.io/gmp/${txhash}`} className="mt-2 link link-accent" target="blank">
                                Track at axelarscan
                            </a>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Home;
