import type { NextPage } from "next";
import Link from 'next/link';
import React, { useState } from "react";


const Home: NextPage = () => {

  return (
    <div>
      <div>
        <h1 className="text-4xl font-medium text-center">
          Axelar Web Examples
        </h1>
        <li><Link href="/examples/call-contract">call-contract</Link></li>
        <li><Link href="/examples/call-contract-with-token">call-contract-with-token</Link></li>
        <li><Link href="/examples/crosschain-swap">crosschain-swap</Link></li>
        <li><Link href="/examples/nft-linker">nft-linker</Link></li>
        <li><Link href="/examples/send-tokens">send-tokens</Link></li>
      </div>
    </div>
  );
};

export default Home;
