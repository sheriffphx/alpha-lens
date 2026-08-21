"use client";

import { useAccount, useChainId, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { erc20Abi } from "@/lib/erc20Abi";
import { botTokens } from "@/lib/tokens";

export function useTokenBalances() {
  const { address } = useAccount();
  const chainId = useChainId();

  const tokens =
    chainId === 677
      ? botTokens.mainnet
      : chainId === 968
        ? botTokens.testnet
        : [];

  const contracts = tokens.map((token) => ({
    address: token.address,
    abi: erc20Abi,
    functionName: "balanceOf" as const,
    args: [address!],
  }));

  const result = useReadContracts({
    contracts,
    query: {
      enabled: !!address,
    },
  });

  const balances = tokens.map((token, index) => {
    const rawBalance = result.data?.[index]?.result;

    return {
      ...token,

      rawBalance,

      balance: rawBalance ? formatUnits(rawBalance, token.decimals) : "0",
    };
  });

  return {
    balances,
    isLoading: result.isLoading,
    isError: result.isError,
  };
}
