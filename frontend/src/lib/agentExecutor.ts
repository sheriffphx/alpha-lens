import type { Address } from "viem";

export const ALPHA_LENS_AGENT_EXECUTOR_ADDRESSES = {
  968: "0xF5B91F7D5a3863C244Ba4Cb9b409da9f88654DF1",
  677: "0xB363a61f16Ca0a69772A9a445c707D5C98590F92",
} as const;

export function getAgentExecutor(chainId: number): Address {
  const address = ALPHA_LENS_AGENT_EXECUTOR_ADDRESSES[chainId as 968 | 677];

  if (!address) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }

  return address as Address;
}
