import cn from "classnames";
import type { NextPage } from "next";
import React, { useCallback, useEffect, useState } from "react";
import { wallet, isTestnet } from "config/constants";
import {
  sendTokenToDestChain,
  getBalance,
  generateRecipientAddress,
  truncatedAddress,
} from "helpers";

const CallContractWithToken: NextPage = () => {
  const [customRecipientAddress, setCustomRecipientAddress] =
    useState<string>("");
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
    console.log(wallet.address)
    const [_balance] = await getBalance([wallet.address], true);
    setSenderBalance(_balance);
  }, []);

  const handleOnGenerateRecipientAddress = () => {
    const recipientAddress = generateRecipientAddress();
    setRecipientAddresses([...recipientAddresses, recipientAddress]);
  };

  const handleOnAddRecepientAddress = () => {
    setRecipientAddresses([...recipientAddresses, customRecipientAddress]);
    setCustomRecipientAddress("");
  };

  useEffect(() => {
    handleRefreshSrcBalances();
  }, [handleRefreshSrcBalances]);

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
            <div className="card-body">
              <h2 className="card-title">Ethereum (Token Sender)</h2>

              <p>
                Sender ({truncatedAddress(wallet.address)}) balance:{" "}
                {senderBalance}
              </p>

              <label className="label">
                <span className="label-text">Recepients</span>
              </label>
              {recipientAddresses.map((recipientAddress) => (
                <span key={recipientAddress} className="mt-1">
                  {truncatedAddress(recipientAddress)}
                </span>
              ))}

              <div className="justify-end mt-2 card-actions">
                <form
                  className="flex flex-col w-full"
                  autoComplete="off"
                  onSubmit={handleOnSubmit}
                >
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
                        className={cn("btn btn-primary", {
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

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">EVM Address</span>
                    </label>
                    <label className="w-full input-group">
                      <input
                        type="text"
                        placeholder="Enter address"
                        className="w-full input input-bordered"
                        value={customRecipientAddress}
                        onChange={(e) =>
                          setCustomRecipientAddress(e.target.value)
                        }
                      />
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleOnAddRecepientAddress}
                      >
                        Add
                      </button>
                    </label>

                    <div className="divider">OR</div>
                    <button
                      onClick={handleOnGenerateRecipientAddress}
                      type="button"
                      className={cn("btn btn-accent mt-2", {
                        loading,
                      })}
                    >
                      Generate Random Address
                    </button>
                  </div>
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
            <div className="card-body">
              <h2 className="card-title">Avalanche (Token Receiver)</h2>
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

export default CallContractWithToken;
