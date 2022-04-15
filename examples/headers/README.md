# Headers
This example showcases a contract that keeps track of headers of other blockchains.

[`Headers.sol`](Headers.sol) is the smart contract used to store the headers of each chain. We only cache up to limited information from each chain.

[`headers.js`](headers.js) showcases how to use this module to set up the above smart contract on multiple chains and communicate the headers accross them.
