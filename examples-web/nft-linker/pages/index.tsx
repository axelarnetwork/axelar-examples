import cn from 'classnames';
import type { NextPage } from 'next';
import React, { useEffect, useState } from 'react';
import { isTestnet } from '../config/constants';
import { sendNftToDest, sendNftBack, ownerOf, truncatedAddress } from '../utils';

const chains = isTestnet ? require('../config/testnet.json') : require('../config/local.json');

const Home: NextPage = () => {
    const [txhash, setTxhash] = useState<string>();
    const [destTxHash, setDestTxHash] = useState<string>();
    const [loading, setLoading] = useState(false);
    const [owner, setOwner] = useState({});
    const [img, setImg] = useState('');

    useEffect(() => {
        ownerOf().then(async (owner) => {
            setOwner(owner);
            await fetchImage(owner);
        });
    }, [setOwner]);

    const fetchImage = async (owner: any) => {
        const json = await fetch(owner.tokenURI).then((res) => res.json());
        const res = await fetch(json.image);
        const imageBlob = await res.blob();
        const imageObjectURL = URL.createObjectURL(imageBlob);
        setImg(imageObjectURL);
    };

    async function handleSendSource(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const onSrcConfirmed = (txhash: string) => {
            setDestTxHash('');
            setTxhash(txhash);
        }
        const onSent = (owner: any) => {
            setOwner(owner);
            setLoading(false);
        };
        await sendNftToDest(onSrcConfirmed, onSent);
    }

    async function handleSendBack(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const onSrcConfirmed = (txhash: string) => {
            setTxhash('');
            setDestTxHash(txhash);
        }
        const onSent = async (owner: any) => {
            setOwner(owner);
            setLoading(false);
        };
        await sendNftBack(onSrcConfirmed, onSent);
    }

    return (
        <div>
            <h1 className="m-5 text-4xl font-medium text-center">General Message Passing (GMP)</h1>
            <h2 className="m-5 text-2xl font-medium text-center">Send NFTs Between Chains</h2>

            <div className="grid grid-cols-2 gap-20 mt-10 justify-items-center">
                {/* source chain card */}
                {generateCard(
                    txhash as string,
                    chains.find((chain: any) => chain.name === 'Avalanche'),
                    handleSendSource,
                    'Send',
                    loading,
                    owner,
                    img
                )}

                {/* Destination chain card */}
                {generateCard(
                    destTxHash as string,
                    chains.find((chain: any) => chain.name === 'Moonbeam'),
                    handleSendBack,
                    'Send Back',
                    loading,
                    owner,
                    img
                )}
            </div>
        </div>
    );
};

const generateCard = (txhash: string, chain: any, onSubmit: any, buttonTitle: string, loading: boolean, owner: any, img: any) => {
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
                        <br />
                        {txhash && <>Tx: {truncatedAddress(txhash)}</>}
                        {txhash && isTestnet && (
                            <a href={`https://testnet.axelarscan.io/gmp/${txhash}`} className="mt-2 link link-accent" target="blank">
                                Track at axelarscan
                            </a>
                        )}
                        <br />
                        {owner.chain === chain.name && img && (
                            <div>
                                <div className="font-extrabold">NFT</div>
                                <img className='rounded-lg' src={img} alt="icons" />
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Home;
