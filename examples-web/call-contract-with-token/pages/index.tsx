import cn from "classnames";
import type { NextPage } from "next";
import React, { useCallback, useState } from "react";
import {
  sendTokenToAvalanche,
  getAvalancheBalance,
  generateRecipientAddress,
  truncatedAddress,
} from "../utils";

const Home: NextPage = () => {
  const [recipientAddresses, setRecipientAddresses] = useState<string[]>([]);
  const [balances, setBalances] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleOnSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const amount = formData.get("amount") as string;
    setLoading(true);
    await sendTokenToAvalanche(amount, recipientAddresses).finally(() => {
      setLoading(false);
      handleRefreshBalances(false);
    });
  }

  const handleRefreshBalances = useCallback(
    async (isSource: boolean) => {
      const _balances = await getAvalancheBalance(recipientAddresses, isSource);
      setBalances(_balances);
      console.log({
        balances,
      });
    },
    [balances, recipientAddresses]
  );

  const handleOnGenerateRecipientAddress = () => {
    const recipientAddress = generateRecipientAddress();
    setRecipientAddresses([...recipientAddresses, recipientAddress]);
  };

  return (
    <div>
      <div>
        <h1 className="text-4xl font-medium text-center">
          General Message Passing (GMP)
        </h1>

        <div className="grid grid-cols-2 gap-20 mt-20 justify-items-center">
          {/* ETHEREUM CARD */}
          <div className="row-span-1 shadow-xl card w-96 bg-base-100">
            <figure
              className="h-64 bg-center bg-no-repeat bg-cover image-full"
              style={{ backgroundImage: "url('/assets/ethereum.gif')" }}
            />
            <div className="card-body">
              <h2 className="card-title">Ethereum (Token Sender)</h2>

              <p>Send a cross-chain token</p>
              <div className="justify-end mt-2 card-actions">
                <form className="w-full" onSubmit={handleOnSubmit}>
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
                  <div className="flex flex-col mt-2">
                    <span className="mt-2">Recipients</span>
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
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* AVALANCHE CARD */}
          <div className="shadow-xl card w-96 bg-base-100">
            <figure
              className="h-64 bg-center bg-no-repeat bg-cover image-full"
              style={{ backgroundImage: "url('/assets/avalanche.gif')" }}
            />
            <div className="card-body">
              <h2 className="card-title">Avalanche (Token Receiver)</h2>
              <div>
                <div className="w-full max-w-xs form-control">
                  <div className="flex flex-col">
                    {recipientAddresses.map((recipientAddress, i) => (
                      <span key={recipientAddress}>
                        {truncatedAddress(recipientAddress)} {balances[i]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div
                className="justify-center mt-5 card-actions"
                onClick={() => handleRefreshBalances(false)}
              >
                <button className="btn btn-primary">Refresh Balances</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
