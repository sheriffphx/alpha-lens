import type { Address } from "viem";

export const botTokens = {
  mainnet: [
    {
      symbol: "WBOT",
      name: "Wrapped BOT",
      address: "0xD5452816194a3784dBa983426cCe7c122F4abd30" as Address,
      decimals: 18,
    },
    {
      symbol: "USDT",
      name: "Tether USD",
      address: "0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C" as Address,
      decimals: 6,
    },
  ],

  testnet: [
    {
      symbol: "WBOT",
      name: "Wrapped BOT",
      address: "0xD5452816194a3784dBa983426cCe7c122F4abd30" as Address,
      decimals: 18,
    },
    {
      symbol: "USDT",
      name: "Tether USD",
      address: "0x75edC9335175Fc0552D51D48439F229c10420fe3" as Address,
      decimals: 6,
    },
  ],
} as const;
