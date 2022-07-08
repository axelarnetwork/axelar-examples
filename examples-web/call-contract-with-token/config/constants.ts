import "dotenv/config";

export const isTestnet = process.env.NEXT_PUBLIC_ENVIRONMENT === "testnet";

export const getChains = () =>
  isTestnet
    ? require(__dirname + "/testnet.json")
    : require(__dirname + "/local.json");
