# Metamask Example
In this example we create two blockchains and connect to them with Metamask. Then we use a simple website to send UST between those two blockchains.

## Creating the Networks 
First run `createNetworks.js` in the background specifying an address to fund. This should be your Metamask address:
```
cd node_modules/@axelar-network/axelar-local-dev/examples/metamask
node createNetworks.js <your metamask address goes here>
```

## Connecting to metamask
While the above is running go to your browser and add the two created networks to metamask. This will be done twice, once for each chain. Open Metamask and click on the Network on the top right and chose *'Create new Network'*. Then fill the following information and click *'Save'*.

For **Chain 1**:
- Network Name: `Chain 1`
- New RPC URL: `http://localhost:8501`
- ChainI ID: `0x9c4`
- Currency Symbol: `ETH` (can be anything)

And for **Chain 2**:
- Network Name: `Chain 2`
- New RPC URL: `http://localhost:8502`
- ChainI ID: `0x9c5`
- Currency Symbol: `ETH` (can be anything)

## Serving the webpage
You then need to serve this directory over **http**. You can simply navigate to this directory and run `serve`:
```
cd node_modules/@axelar-network/axelar-local-dev/examples/metamask
npx serve -l 8000
```

## Using the webpage
Open your browser and navigate to the [served webpage](http://localhost:8000). Changing the selected chain should prompt you to chainge the active network with metamask. Click the **Add UST to Wallet** button to add UST to your wallet. This should be done for both networks. If you add your address as the *Destination Address* and specify an amount you will be able to approve and send UST to the other chain.

## Resetting
If you stop and restart the blockchains you will need to reset your account. This can be done in the *Advanced Settings* of Metamask.

