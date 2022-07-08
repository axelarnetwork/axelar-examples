import "dotenv/config";

export const isTestnet = process.env.NEXT_PUBLIC_ENVIRONMENT === "testnet";
