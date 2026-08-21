"use client";

import { useReadContract, useReadContracts, useChainId } from "wagmi";
import { bdexV2FactoryAbi, bdexV2PairAbi } from "@/lib/bdexV2Abi";
import { bdexV2Factories } from "@/lib/bdex";
import { erc20Abi } from "@/lib/erc20Abi";
import { formatUnits } from "viem";
import { usePrices } from "@/hooks/usePrices";
import { calculateLiquiditySuitability } from "@/lib/liquidityEngine";
import { calculateOpportunityScore } from "@/lib/opportunityEngine";
import { useBdexPoolActivity } from "@/hooks/useBdexPoolActivity";
import { calculateYieldSanity } from "@/lib/yieldEngine";
import { generateRecommendation } from "@/lib/recommendationEngine";
import { matchOpportunityToPortfolio } from "@/lib/personalizedOpportunityEngine";
import { generateCopilotRecommendation } from "@/lib/copilotEngine";
import type { PortfolioRisk } from "@/lib/portfolioRiskEngine";

export function useBdexPools(
  userCapitalUsd = 0,
  portfolioRisk: Pick<PortfolioRisk, "score" | "level"> = {
    score: 0,
    level: "low",
  },
) {
  const chainId = useChainId();

  const factoryAddress =
    chainId === 968
      ? bdexV2Factories.testnet
      : chainId === 677
        ? bdexV2Factories.mainnet
        : undefined;
  /*
   * Step 1:
   * Get number of BDEX pairs
   */

  const {
    data: pairCount,
    isLoading: pairCountLoading,
    isError: pairCountError,
  } = useReadContract({
    address: factoryAddress,
    abi: bdexV2FactoryAbi,
    functionName: "allPairsLength",
  });

  const count = pairCount ? Number(pairCount) : 0;

  /** TVL */
  const { prices, isLoading: pricesLoading } = usePrices();

  /*
   * Step 2:
   * Create indexes:
   *
   * [0, 1, 2, ... 26]
   */

  const pairIndexes = Array.from({ length: count }, (_, index) => index);

  /*
   * Step 3:
   * Get pair addresses
   */

  const {
    data: pairResults,
    isLoading: pairsLoading,
    isError: pairsError,
  } = useReadContracts({
    contracts: factoryAddress
      ? pairIndexes.map((index) => ({
          address: factoryAddress,
          abi: bdexV2FactoryAbi,
          functionName: "allPairs" as const,
          args: [BigInt(index)],
        }))
      : [],
  });

  const pairAddresses =
    pairResults
      ?.map((result) => result.result)
      .filter(
        (address): address is `0x${string}` => typeof address === "string",
      ) ?? [];

  /*
   * Step 4:
   * Read token0, token1 and reserves
   * from every pair.
   */

  const pairContracts = pairAddresses.flatMap((pairAddress) => [
    {
      address: pairAddress,
      abi: bdexV2PairAbi,
      functionName: "token0" as const,
    },
    {
      address: pairAddress,
      abi: bdexV2PairAbi,
      functionName: "token1" as const,
    },
    {
      address: pairAddress,
      abi: bdexV2PairAbi,
      functionName: "getReserves" as const,
    },
  ]);

  const {
    data: pairDetails,
    isLoading: detailsLoading,
    isError: detailsError,
  } = useReadContracts({
    contracts: pairContracts,
  });

  /*
   * Step 5:
   * Convert the flat results into pools.
   */

  const pools: Array<{
    address: `0x${string}`;
    token0: `0x${string}`;
    token1: `0x${string}`;
    reserve0: bigint;
    reserve1: bigint;
  }> = [];

  for (let i = 0; i < pairAddresses.length; i++) {
    const resultIndex = i * 3;

    const token0 = pairDetails?.[resultIndex]?.result as
      `0x${string}` | undefined;

    const token1 = pairDetails?.[resultIndex + 1]?.result as
      `0x${string}` | undefined;

    const reserves = pairDetails?.[resultIndex + 2]?.result as
      readonly [bigint, bigint, number] | undefined;

    if (!token0 || !token1 || !reserves) {
      continue;
    }

    pools.push({
      address: pairAddresses[i],
      token0,
      token1,
      reserve0: reserves[0],
      reserve1: reserves[1],
    });
  }

  const tokenAddresses = [
    ...new Set(pools.flatMap((pool) => [pool.token0, pool.token1])),
  ];

  const {
    data: tokenMetadataResults,
    isLoading: metadataLoading,
    isError: metadataError,
  } = useReadContracts({
    contracts: tokenAddresses.flatMap((tokenAddress) => [
      {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "symbol" as const,
      },
      {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "name" as const,
      },
      {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "decimals" as const,
      },
    ]),
  });

  const tokenMetadata = new Map<
    string,
    {
      symbol: string;
      name: string;
      decimals: number;
    }
  >();

  for (let i = 0; i < tokenAddresses.length; i++) {
    const resultIndex = i * 3;

    const symbol = tokenMetadataResults?.[resultIndex]?.result;

    const name = tokenMetadataResults?.[resultIndex + 1]?.result;

    const decimals = tokenMetadataResults?.[resultIndex + 2]?.result;

    if (
      typeof symbol !== "string" ||
      typeof name !== "string" ||
      typeof decimals !== "number"
    ) {
      continue;
    }

    tokenMetadata.set(tokenAddresses[i].toLowerCase(), {
      symbol,
      name,
      decimals,
    });
  }

  const readablePools = pools.map((pool) => {
    const metadata0 = tokenMetadata.get(pool.token0.toLowerCase());

    const metadata1 = tokenMetadata.get(pool.token1.toLowerCase());

    const reserve0 = metadata0
      ? formatUnits(pool.reserve0, metadata0.decimals)
      : "0";

    const reserve1 = metadata1
      ? formatUnits(pool.reserve1, metadata1.decimals)
      : "0";

    return {
      ...pool,

      token0Symbol: metadata0?.symbol ?? "Unknown",

      token0Name: metadata0?.name ?? "Unknown",

      token0Decimals: metadata0?.decimals ?? 18,

      token1Symbol: metadata1?.symbol ?? "Unknown",

      token1Name: metadata1?.name ?? "Unknown",

      token1Decimals: metadata1?.decimals ?? 18,

      reserve0Formatted: reserve0,
      reserve1Formatted: reserve1,
    };
  });

  const poolsWithTvl = readablePools.map((pool) => {
    const token0Price = prices?.[pool.token0Symbol as keyof typeof prices] ?? 0;

    let token1Price = prices?.[pool.token1Symbol as keyof typeof prices] ?? 0;

    if (
      token1Price === 0 &&
      token0Price > 0 &&
      Number(pool.reserve0Formatted) > 0 &&
      Number(pool.reserve1Formatted) > 0
    ) {
      token1Price =
        (Number(pool.reserve0Formatted) * token0Price) /
        Number(pool.reserve1Formatted);
    }

    const reserve0Value = Number(pool.reserve0Formatted) * token0Price;

    const reserve1Value = Number(pool.reserve1Formatted) * token1Price;

    const tvl = reserve0Value + reserve1Value;

    return {
      ...pool,
      token0Price,
      token1Price,
      reserve0Value,
      reserve1Value,
      tvl,
    };
  });

  const poolsWithSuitability = poolsWithTvl.map((pool) => {
    const liquidity = calculateLiquiditySuitability(userCapitalUsd, pool.tvl);

    return {
      ...pool,
      liquidity,
    };
  });

  const activityPools = poolsWithSuitability.map((pool) => ({
    address: pool.address,
    token0Decimals: pool.token0Decimals,
    token1Decimals: pool.token1Decimals,
    token0Price: pool.token0Price,
    token1Price: pool.token1Price,
  }));

  const {
    activity,
    isLoading: activityLoading,
    isError: activityError,
  } = useBdexPoolActivity(activityPools);

  const poolsWithActivity = poolsWithSuitability.map((pool) => {
    const poolActivity = activity.find(
      (item) => item.poolAddress.toLowerCase() === pool.address.toLowerCase(),
    );

    return {
      ...pool,

      swapCount24h: poolActivity?.swapCount24h ?? 0,

      volume24hUsd: poolActivity?.volume24hUsd ?? 0,

      fees24hUsd: poolActivity?.fees24hUsd ?? 0,

      activityError: poolActivity?.isError ?? false,
    };
  });

  const poolsWithYield = poolsWithActivity.map((pool) => {
    const feeApr =
      pool.tvl > 0 ? ((pool.fees24hUsd * 365) / pool.tvl) * 100 : 0;

    return {
      ...pool,
      feeApr,
    };
  });

  const poolsWithYieldSanity = poolsWithYield.map((pool) => {
    const yieldSanity = calculateYieldSanity({
      tvl: pool.tvl,
      feeApr: pool.feeApr,
      volume24hUsd: pool.volume24hUsd,
    });

    return {
      ...pool,
      yieldSanity,
    };
  });

  const poolsWithOpportunities = poolsWithYieldSanity.map((pool) => {
    const opportunity = calculateOpportunityScore(pool);

    const recommendation = generateRecommendation({
      ...pool,
      opportunity,
    });

    const personalized = matchOpportunityToPortfolio(
      {
        ...pool,
        opportunity,
        recommendation,
      },
      userCapitalUsd,
    );

    return {
      ...pool,

      opportunity,

      recommendation,

      personalized,
    };
  });

  const rankedPools = [...poolsWithOpportunities].sort(
    (a, b) => b.opportunity.score - a.opportunity.score,
  );

  const poolsWithCopilot = rankedPools.map((pool) => {
    const copilot = generateCopilotRecommendation(pool, portfolioRisk);

    return {
      ...pool,
      copilot,
    };
  });

  return {
    pairCount: count,
    pairAddresses,
    pools: poolsWithCopilot,

    isLoading:
      pairCountLoading ||
      pairsLoading ||
      detailsLoading ||
      metadataLoading ||
      pricesLoading ||
      activityLoading,

    isError:
      pairCountError ||
      pairsError ||
      detailsError ||
      metadataError ||
      activityError,
  };
}
