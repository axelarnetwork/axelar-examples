import cn from "classnames";
import type { NextPage } from "next";
import React, { useCallback, useEffect, useState } from "react";
import { wallet, isTestnet } from "config/constants";
import {
  sendTokenToDestChain,
  getBalance,
  generateRecipientAddress,
  truncatedAddress,
  waitDestExecution,
} from "helpers";

const CallContractWithToken: NextPage = () => {
  const [destRecipientAddresses, setDestRecipientAddresses] = useState<
    string[]
  >([]);
  const [sourceRecipientAddresses, setSourceRecipientAddresses] = useState<
    string[]
  >([]);
  const [recipientBalances, setRecipientBalances] = useState<string[]>([]);
  const [senderBalance, setSenderBalance] = useState<string>();
  const [txhash, setTxhash] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [loadingDestBalance, setLoadingDestBalance] = useState(false);

  async function handleOnSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const amount = formData.get("amount") as string;
    setLoading(true);
    await sendTokenToDestChain(amount, sourceRecipientAddresses, setTxhash);

    const [_balance] = await getBalance([wallet.address], true);
    setSenderBalance(_balance);

    setLoading(false);
    setLoadingDestBalance(true);

    await waitDestExecution();

    const recipients = [
      ...new Set([...destRecipientAddresses, ...sourceRecipientAddresses]),
    ];
    setDestRecipientAddresses(recipients);

    const _balances = await getBalance(recipients, false);
    setRecipientBalances(_balances);
    setLoadingDestBalance(false);
  }

  const handleRefreshSrcBalances = useCallback(async () => {}, []);

  const handleOnGenerateRecipientAddress = () => {
    const recipientAddress = generateRecipientAddress();
    setSourceRecipientAddresses([
      ...sourceRecipientAddresses,
      recipientAddress,
    ]);
  };

  useEffect(() => {
    async function loadingBalances() {
      const [_balance] = await getBalance([wallet.address], true);
      setSenderBalance(_balance);
    }

    loadingBalances();
  }, [handleRefreshSrcBalances]);

  function renderRecipientBalances() {
    if (destRecipientAddresses.length) {
      return destRecipientAddresses.map((recipientAddress, i) => (
        <div key={recipientAddress} className="flex justify-between">
          <span className="font-mono">
            {truncatedAddress(recipientAddress)}
          </span>
          <span className="font-bold">{recipientBalances[i] || `0.00`}</span>
        </div>
      ));
    } else {
      return <p className="text-gray-500 font-lg">Empty</p>;
    }
  }

  return (
    <div>
      <div>
        <h1 className="text-4xl font-medium text-center">
          Send token with custom logic to another chain
        </h1>
        <div className="grid grid-cols-2 gap-20 mt-20 justify-items-center">
          {/* source chain card */}
          <div className="row-span-2 shadow-xl card w-96 bg-base-100">
            <figure
              className="h-64 bg-center bg-no-repeat bg-cover image-full"
              style={{ backgroundImage: "url('/assets/ethereum.gif')" }}
            />
            <div className="card-body flex flex-col">
              <h2 className="card-title">Ethereum (Token Sender)</h2>

              <p>
                Sender:{" "}
                <span className="font-mono">
                  ({truncatedAddress(wallet.address)})
                </span>{" "}
              </p>
              <p>Balance: {senderBalance}</p>

              {sourceRecipientAddresses.length > 0 && (
                <label
                  className={cn("mt-1", {
                    "opacity-30": loading,
                    "opacity-100": !loading,
                  })}
                >
                  <span className="label-text font-bold text-lg">
                    Recipients{" "}
                    <span className="font-bold">
                      ({sourceRecipientAddresses.length})
                    </span>
                  </span>
                </label>
              )}
              {sourceRecipientAddresses.map((recipientAddress) => (
                <div className="flex items-center" key={recipientAddress}>
                  <span className="mt-1 font-mono text-sm">
                    {truncatedAddress(recipientAddress)}
                  </span>
                  <button
                    className={cn("ml-4 text-xs", {
                      hidden: loading,
                      block: !loading,
                    })}
                    disabled={loading}
                    onClick={() =>
                      setSourceRecipientAddresses(
                        sourceRecipientAddresses.filter(
                          (addr) => addr !== recipientAddress
                        )
                      )
                    }
                  >
                    ❌
                  </button>
                </div>
              ))}

              <div className="form-control">
                <button
                  onClick={handleOnGenerateRecipientAddress}
                  type="button"
                  disabled={loading}
                  className={cn("btn btn-accent mt-4", {
                    "opacity-30": loading,
                    "opacity-100": !loading,
                  })}
                >
                  Add Random Recipient
                </button>
              </div>

              <div className="justify-end mt-2 card-actions">
                <form
                  className="flex flex-col w-full"
                  autoComplete="off"
                  onSubmit={handleOnSubmit}
                >
                  <div>
                    <label className="label">
                      <span className="label-text">Send Amount</span>
                    </label>
                    <div className="w-full input-group">
                      <input
                        disabled={loading}
                        required
                        name="amount"
                        type="number"
                        min={0}
                        step={1}
                        placeholder="Enter amount to send"
                        className="w-full input input-bordered"
                      />
                    </div>

                    <button
                      className={cn("btn btn-primary mt-4 w-full", {
                        loading,
                        "opacity-30":
                          loading || sourceRecipientAddresses.length === 0,
                        "opacity-100":
                          !loading && sourceRecipientAddresses.length > 0,
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
                </form>
              </div>
            </div>
          </div>

          {/* Destination chain card */}
          <div className="row-span-1 shadow-xl card w-96 bg-base-100">
            <figure
              className="h-64 bg-center bg-no-repeat bg-cover image-full"
              style={{ backgroundImage: "url('/assets/avalanche.gif')" }}
            />
            <div
              className={cn("card-body", {
                "opacity-30": loadingDestBalance || loading,
                "opacity-100": !loadingDestBalance && !loading,
              })}
            >
              <h2 className="card-title">Avalanche (Token Receiver)</h2>
              <div className="h-40">
                <div className="h-full max-w-xs form-control">
                  {renderRecipientBalances()}
                  {(loadingDestBalance || loading) && (
                    <div className="flex flex-1 flex-col justify-end">
                      <span className="font-bold">
                        Waiting for Execution...
                        <progress className="progress"></progress>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallContractWithToken;
