import type { Address } from "viem";

export const AGENT_DEPLOYMENTS = {
  968: {
    chainId: 968,
    chainName: "BOT Chain Testnet",

    executor: "0xF5B91F7D5a3863C244Ba4Cb9b409da9f88654DF1" as Address,

    router: "0xD6425a02f0845B8D99e349C34D2E7A576E177345" as Address,
  },

  677: {
    chainId: 677,
    chainName: "BOT Chain",

    executor: "0xB363a61f16Ca0a69772A9a445c707D5C98590F92" as Address,

    router: "0x1414eD29FdFD322c3c0a830330ed982E2D629e76" as Address,
  },
} as const;

export function getAgentDeployment(chainId: number) {
  const deployment =
    AGENT_DEPLOYMENTS[chainId as keyof typeof AGENT_DEPLOYMENTS];

  if (!deployment) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  return deployment;
}
