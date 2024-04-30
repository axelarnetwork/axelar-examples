# Multichain Game

This example demonstrates a simple guessing game where users can guess a number between 1-6 and stake some funds for each guess. If the correct number is guessed then you win the pot! The `MultichainGameReceiver` exists on a single chain and can hold a variety of different tokens. It pays back the winner playing the game via the `MultiChainGame` contract on one of the satellite chains the game is deployed on.

### Deployment

```bash
 npm run deploy evm/multichain-game [local|testnet]
```
This will deploy the MultichainGame and MultichainGame Receiver contract.

### Execution

To execute the Game run the following command.

```bash
 npm run execute evm/multichain-game local [local|testnet]
 ```

 ### Example

```bash
npm run deploy evm/multichain-game local
npm run execute evm/multichain-game local "Avalanche" "Fantom" 3 "aUSDC" 3
```

Output:
```
--- Initially ---
your balance at Avalanche is 1000000000000000000
pot balance at Fantom is 0
guess on Fantom chain guess was: 3
you guessed wrong!
guess on Fantom chain guess was: 4
you guessed wrong!
pot balance is now 3
guess on Fantom chain guess was: 5
you guessed right!
---- AFTER CORRECT GUESS ----
pot balance at Fantom is now 0
your balance at Avalanche is now 1000000000000000003
```