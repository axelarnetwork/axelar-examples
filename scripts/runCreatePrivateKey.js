/**
 * Create a local random private key and writing it and the mneumonic to your .env file.
 * This is designed to accelerate demos and getting started with this repo.
 */
const bip39 = require('bip39');
const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

if (!fs.existsSync('.env')) {
    const envExamplePath = path.join(__dirname, '..', '.env.example');
    const contents = fs.readFileSync(envExamplePath);
    console.log('Generating new random key.');
    // Generate mnemonic
    const mnemonic = bip39.generateMnemonic();
    // Convert to private key
    const wallet = ethers.Wallet.fromMnemonic(mnemonic);

    // Write to .env in the root of the project
    console.log('Creating .env file in ', path.dirname(__dirname));
    const newEnvFile = contents.toString().replace('YOUR_PRIVATE_KEY_HERE',`${wallet.privateKey}\nEVM_MNEMONIC="${mnemonic}"`);
    const envPath = path.join(__dirname, '..', '.env');
    fs.writeFileSync(envPath, newEnvFile);
} else {
    console.log(`A .env file already exist in ${path.dirname(__dirname)}, not modifying it.`);
}
