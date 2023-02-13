import { Card } from "components/Card";
import type { NextPage } from "next";
import Link from "next/link";
import React from "react";

const Home: NextPage = () => {
  return (
    <div>
      <div>
        <h1 className="text-4xl font-medium text-center">
          Axelar Web Examples
        </h1>
        <div className="flex flex-col items-center mt-8">
          <div className="flex flex-row flex-wrap">
            <Card
              classname="mx-2 my-2"
              title="Send message to another chain"
              description="Transfer messages from the source chain to the destination chain using the Axelar Gateway's `callContract` function."
              url="/examples/call-contract"
            />
            <Card
              classname="mx-2 my-2"
              title="Send token to another chain"
              description="Simply sending a token from source chain to the destination chain"
              url="/examples/send-tokens"
            />
            <Card
              classname="mx-2 my-2"
              title="Send token with custom logic to another chain"
              description="Transfer tokens and execute custom logic to the destination chain using the `callContractWithToken` function of the Axelar Gateway contract."
              url="/examples/call-contract-with-token"
            />
            <Card
              classname="mx-2 my-2"
              title="Send NFTs Between Chains"
              description="Send a NFT token from source chain to the destination chain"
              url="/examples/nft-linker"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
