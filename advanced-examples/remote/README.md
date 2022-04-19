# Remote
This example showcases the two ways to set up a test environment and connect to it remotely.

First we create two blockchains in [`exportNetworks.js`](exportNetworks.js). One of them is a preconfigured `Network`, while the other is a blank blockchain that was then configured to support Axelar.

Then we can use our two blockchains remotely as shown in [`useNetworks.js`](useNetworks.js).
Note: `exportNetworks.js` has to be running in the background to use `useNetworks.js`.
