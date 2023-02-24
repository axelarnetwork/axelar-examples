# Axelar Example NEAR Contract

# Intro

NEAR contract that supports communication with Axelar gateway to send and recieve messages.

# Quickstart

1. Make sure you have installed [rust](https://doc.rust-lang.org/cargo/getting-started/installation.html).
2. Install the [`NEAR CLI`](https://github.com/near/near-cli#setup) (if you plan to deploy the contract)

<br />

## 1. Build contract

```bash
./build.sh
```

<br />

## 2. Build and Deploy the Contract (required NEAR setup)

You can automatically compile and deploy the contract in the NEAR testnet by running:

```bash
./deploy.sh
```

Once finished, check the `neardev/dev-account` file to find the address in which the contract was deployed:

```bash
cat ./neardev/dev-account
# e.g. dev-1659899566943-21539992274727
```
