import "dotenv/config";
import fs from "fs/promises";
import path from 'path'

async function main() {
  const rootEnvPath= path.resolve(__dirname, '../../.env')
  const rootEnv = await fs.readFile(rootEnvPath, 'utf8');
  const rootEnvLines = rootEnv.split('\n');
  const evmPrivateKey = rootEnvLines.find((line) => line.startsWith('EVM_PRIVATE_KEY'))?.split('=')[1];
  const evmMnemonic = rootEnvLines.find((line) => line.startsWith('EVM_MNEMONIC'))?.split('=')[1];

  if(!evmPrivateKey || !evmMnemonic) throw new Error('EVM_PRIVATE_KEY or EVM_MNEMONIC not found in root .env file')

  const examplesWebEnvPath = path.resolve(__dirname, '../.env')
  const examplesWebEnv = `NEXT_PUBLIC_EVM_PRIVATE_KEY=${evmPrivateKey}\nNEXT_PUBLIC_EVM_MNEMONIC=${evmMnemonic}`;
  await fs.writeFile(examplesWebEnvPath, examplesWebEnv);
}

main();
