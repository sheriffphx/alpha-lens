import type { Address } from "viem";

export const bdexV2Factories = {
  mainnet: "0x117115f3B72C8d1989178089A67D0C26f8EE0AA3" as Address,

  testnet: "0x65b8e98ceA190d8c28B3e4716402027f634d15a3" as Address,
} as const;

export const bdexExecution = {
  testnet: {
    token0: "0x75edC9335175Fc0552D51D48439F229c10420fe3" as Address,
    token1: "0xD5452816194a3784dBa983426cCe7c122F4abd30" as Address,

    token0Symbol: "USDT",
    token1Symbol: "WBOT",

    token0Decimals: 6,
    token1Decimals: 18,
  },
} as const;
