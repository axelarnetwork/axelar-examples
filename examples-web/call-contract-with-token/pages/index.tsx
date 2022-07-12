import cn from "classnames";
import type { NextPage } from "next";
import React, { useCallback, useEffect, useState } from "react";
import { wallet, isTestnet } from "../config/constants";
import {
  sendTokenToDestChain,
  getBalance,
  generateRecipientAddress,
  truncatedAddress,
} from "../utils";

const Home: NextPage = () => {
  const [recipientAddresses, setRecipientAddresses] = useState<string[]>([]);
  const [balances, setBalances] = useState<string[]>([]);
  const [senderBalance, setSenderBalance] = useState<string>();
  const [txhash, setTxhash] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function handleOnSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const amount = formData.get("amount") as string;
    setLoading(true);
    await sendTokenToDestChain(amount, recipientAddresses, setTxhash).finally(
      () => {
        setLoading(false);
        handleRefreshSrcBalances();
        handleRefreshDestBalances();
      },
    );
  }

  const handleRefreshDestBalances = useCallback(async () => {
    const _balances = await getBalance(recipientAddresses, false);
    setBalances(_balances);
  }, [recipientAddresses]);

  const handleRefreshSrcBalances = useCallback(async () => {
    const [_balance] = await getBalance([wallet.address], true);
    setSenderBalance(_balance);
  }, []);

  const handleOnGenerateRecipientAddress = () => {
    const recipientAddress = generateRecipientAddress();
    setRecipientAddresses([...recipientAddresses, recipientAddress]);
  };

  useEffect(() => {
    handleRefreshSrcBalances();
  }, [handleRefreshSrcBalances]);

  return (
    <div>
      <div>
        <h1 className="text-4xl font-medium text-center">
          General Message Passing (GMP)
        </h1>
        <h2 className="text-base text-center">Call Contract With Token</h2>

        <div className="grid grid-cols-2 gap-20 mt-20 justify-items-center">
          {/* AVALANCHE CARD */}
          <div className="row-span-2 shadow-xl card w-96 bg-base-100">
            <figure
              className="h-64 bg-center bg-no-repeat bg-cover image-full"
              style={{ backgroundImage: "url('/assets/avalanche.gif')" }}
            />
            <div className="card-body">
              <h2 className="card-title">Avalanche (Token Sender)</h2>

              <p>
                Sender ({truncatedAddress(wallet.address)}) balance:{" "}
                {senderBalance}
              </p>
              <p>Send a cross-chain token</p>
              <div className="justify-end mt-2 card-actions">
                <form
                  className="flex flex-col w-full"
                  onSubmit={handleOnSubmit}
                >
                  <div className="flex">
                    <input
                      disabled={loading}
                      required
                      name="amount"
                      type="number"
                      placeholder="Enter amount to send"
                      className="w-full max-w-xs input input-bordered"
                    />
                    <button
                      className={cn("btn btn-primary ml-2", {
                        loading,
                        "opacity-30":
                          loading || recipientAddresses.length === 0,
                        "opacity-100":
                          !loading && recipientAddresses.length > 0,
                      })}
                      type="submit"
                    >
                      Send
                    </button>
                  </div>
                  {txhash && isTestnet && (
                    <a
                      href={`https://testnet.axelarscan.io/gmp/${txhash}`}
                      className="mt-2 link link-accent"
                      target="blank"
                    >
                      Track at axelarscan
                    </a>
                  )}
                  <span className="mt-2 font-bold">Recipients</span>
                  {recipientAddresses.map((recipientAddress) => (
                    <span key={recipientAddress} className="mt-1">
                      {truncatedAddress(recipientAddress)}
                    </span>
                  ))}

                  <button
                    onClick={handleOnGenerateRecipientAddress}
                    type="button"
                    className={cn("btn btn-accent mt-2", {
                      loading,
                    })}
                  >
                    Add recipient
                  </button>
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
                  <div>
                    {recipientAddresses.map((recipientAddress, i) => (
                      <div
                        key={recipientAddress}
                        className="flex justify-between"
                      >
                        <span>{truncatedAddress(recipientAddress)}</span>
                        <span className="font-bold">
                          {balances[i] || `0.00`}
                        </span>
                      </div>
                    ))}
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
