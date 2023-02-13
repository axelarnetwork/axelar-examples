import cn from "classnames";
import type { NextPage } from "next";
import React, { useState } from "react";
import {
  sendMessageToAvalanche,
  getAvalancheMessage,
  getAvalancheSourceChain,
} from "helpers";

const CallContract: NextPage = () => {
  const [msg, setMsg] = useState<string>("");
  const [sourceChain, setSourceChain] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function handleOnSubmitMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    setLoading(true);
    await sendMessageToAvalanche(formData.get("message") as string).finally(
      () => {
        setLoading(false)
      },
    );
  }

  async function handleOnGetMessage() {
    const _msg = await getAvalancheMessage();
    const _sourceChain = await getAvalancheSourceChain();
    console.log({
      _sourceChain,
    });
    setMsg(_msg);
    setSourceChain(_sourceChain);
  }

  return (
    <div>
      <div>
        <h1 className="text-4xl font-medium text-center">
          Send message to another chain
        </h1>

        <div className="grid grid-cols-2 gap-20 mt-20 justify-items-center">
          {/* ETHEREUM CARD */}
          <div className="row-span-1 shadow-xl card w-96 bg-base-100">
            <figure
              className="h-64 bg-center bg-no-repeat bg-cover image-full"
              style={{ backgroundImage: "url('/assets/ethereum.gif')" }}
            />
            <div className="card-body">
              <h2 className="card-title">Ethereum (Message Sender)</h2>
              <p>Send a cross-chain message</p>
              <div className="justify-end mt-10 card-actions">
                <form className="flex w-full" autoComplete="off" onSubmit={handleOnSubmitMessage}>
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
                    className={cn("btn btn-primary ml-2", {
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

          {/* AVALANCHE CARD */}
          <div className="row-span-2 shadow-xl card w-96 bg-base-100">
            <figure
              className="h-64 bg-center bg-no-repeat bg-cover image-full"
              style={{ backgroundImage: "url('/assets/avalanche.gif')" }}
            />
            <div className="card-body">
              <h2 className="card-title">Avalanche (Message Receiver)</h2>
              <div>
                <div className="w-full max-w-xs form-control">
                  <label className="label">
                    <span className="label-text">Message</span>
                  </label>
                  <input
                    readOnly
                    type="text"
                    placeholder="Type here"
                    className="w-full max-w-xs input input-bordered"
                    value={msg}
                  />
                </div>
                <div className="w-full max-w-xs form-control">
                  <label className="label">
                    <span className="label-text">Source Chain</span>
                  </label>
                  <input
                    readOnly
                    type="text"
                    placeholder="Type here"
                    className="w-full max-w-xs input input-bordered"
                    value={sourceChain}
                  />
                </div>
              </div>
              <div
                className="justify-end mt-5 card-actions"
                onClick={handleOnGetMessage}
              >
                <button className="btn btn-primary">Refresh Contract</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallContract;
