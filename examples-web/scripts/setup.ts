import "dotenv/config";
import fs from "fs";
import path from 'path'

function getEnvValue(rootEnv: string, key: string) {
  const rootEnvLines = rootEnv.split('\n');
  return rootEnvLines.find((line: any) => line.startsWith(key))?.split('=')[1];
}

async function main() {
  const rootEnvPath= path.resolve(__dirname, '../../.env')
  const rootEnv = fs.readFileSync(rootEnvPath).toString();
  const evmPrivateKey = getEnvValue(rootEnv, "EVM_PRIVATE_KEY") || ""
  const evmMnemonic = getEnvValue(rootEnv, 'EVM_MNEMONIC') || ""

  if(!evmPrivateKey && !evmMnemonic) throw new Error('EVM_PRIVATE_KEY and EVM_MNEMONIC not found in root .env file')

  const examplesWebEnvPath = path.resolve(__dirname, '../.env')
  const examplesWebEnv = `NEXT_PUBLIC_EVM_PRIVATE_KEY=${evmPrivateKey}\nNEXT_PUBLIC_EVM_MNEMONIC=${evmMnemonic}`;
  await fs.writeFileSync(examplesWebEnvPath, examplesWebEnv);
  console.log(`The setup is done! The environment variables have been written to the examples-web/.env file. You're now ready to deploy and start the application.`);
}

main();
