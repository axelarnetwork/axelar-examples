# Example Web

The `examples-web` section has a collection of end-to-end examples. All examples are bundled in the same package so it's easy to setup and run all examples.

## Prerequisite

1. Make sure you've already setup `.env` file in root directory. (See [here](../README.md#set-up-deployer-key))
2. Run `npm run setup`

## Run Web Examples in Local

1. Run `npm run contracts:build` to compile all smart contracts.
2. Run `npm run contracts:deploy` to deploy all smart contracts.
3. Run `npm run dev` to start web application server.
4. Visit http://localhost:3000 in your web browser to play with examples demo.

You should see the website looks like image below.
![examples-web](/docs/examples-web.png)
