"use client";

import { useChainId, useReadContract } from "wagmi";
import { agentExecutorAbi } from "@/lib/agentExecutorAbi";
import { getAgentExecutor } from "@/lib/agentExecutor";

export type AgentPolicy = {
  owner: `0x${string}`;
  agent: `0x${string}`;

  tokenIn: `0x${string}`;
  tokenOut: `0x${string}`;

  maxAmount: bigint;
  maxSlippageBps: bigint;
  minOpportunityScore: bigint;

  cooldown: bigint;
  lastExecution: bigint;

  expiry: bigint;

  active: boolean;
};

export function useAgentPolicy(policyId: number | null) {
  const chainId = useChainId();
  const enabled = policyId !== null && policyId > 0;

  let agentExecutorAddress: `0x${string}` | undefined;
  try {
    agentExecutorAddress = getAgentExecutor(chainId);
  } catch {
    agentExecutorAddress = undefined;
  }

  const { data, isLoading, isError, error, refetch } = useReadContract({
    address: agentExecutorAddress,
    abi: agentExecutorAbi,
    functionName: "policies",
    args: enabled ? [BigInt(policyId!)] : undefined,
    query: {
      enabled: enabled && !!agentExecutorAddress,
    },
  });

  const policy: AgentPolicy | null = data
    ? {
        owner: data[0],
        agent: data[1],
        tokenIn: data[2],
        tokenOut: data[3],
        maxAmount: data[4],
        maxSlippageBps: data[5],
        minOpportunityScore: data[6],
        cooldown: data[7],
        lastExecution: data[8],
        expiry: data[9],
        active: data[10],
      }
    : null;

  return {
    policy,
    isLoading,
    isError,
    error,
    refetch,
  };
}
