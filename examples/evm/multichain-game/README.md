# Multichain Game

This example demonstrates a simple guessing game where users can guess a number between 1-6 and stake some funds for each guess. If the correct number is guessed then you win the pot! The `MultichainGameReceiver` exists on a single chain and can hold a variety of different tokens. It pays back the winner playing the game via the `MultiChainGame` contract on one of the satellite chains the game is deployed on.

# Testnet
On testnet this can be tested from Celo chain where you can send WETH to the Polygon Mumbai testnet to conduct the swap on the Uniswap router.

## Local Test
Local testing with Axelar Local Dev is WIP.