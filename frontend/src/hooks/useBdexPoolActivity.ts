"use client";

import { useEffect, useState } from "react";
import {
  createPublicClient,
  decodeEventLog,
  http,
  keccak256,
  parseAbiItem,
  toBytes,
  type Address,
} from "viem";

import { botChain } from "@/lib/wagmi";
import { bdexV2PairAbi } from "@/lib/bdexV2Abi";

const SWAP_EVENT_SIGNATURE = keccak256(
  toBytes("Swap(address,uint256,uint256,uint256,uint256,address)"),
);

export type BdexPoolActivity = {
  poolAddress: Address;

  swapCount24h: number;

  volume24hUsd: number;

  fees24hUsd: number;

  isLoading: boolean;

  isError: boolean;
};

type PoolInput = {
  address: Address;

  token0Decimals: number;
  token1Decimals: number;

  token0Price: number;
  token1Price: number;
};

export function useBdexPoolActivity(pools: PoolInput[]) {
  const [activity, setActivity] = useState<BdexPoolActivity[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (pools.length === 0) {
      setActivity([]);
      return;
    }

    async function loadActivity() {
      setIsLoading(true);
      setIsError(false);

      try {
        const client = createPublicClient({
          chain: botChain,
          transport: http(),
        });

        /*
         * ------------------------------------------------
         * 1. Determine the 24H block range
         * ------------------------------------------------
         */

        const latestBlock = await client.getBlockNumber();

        const sampleBlocks = BigInt(100);

        const earlierBlockNumber =
          latestBlock > sampleBlocks ? latestBlock - sampleBlocks : BigInt(0);

        const latestBlockData = await client.getBlock({
          blockNumber: latestBlock,
        });

        const earlierBlockData = await client.getBlock({
          blockNumber: earlierBlockNumber,
        });

        const blockDifference = Number(latestBlock - earlierBlockNumber);

        const timeDifference = Number(
          latestBlockData.timestamp - earlierBlockData.timestamp,
        );

        const averageSecondsPerBlock = timeDifference / blockDifference;

        const blocksPer24Hours = BigInt(
          Math.ceil((24 * 60 * 60) / averageSecondsPerBlock),
        );

        const fromBlock =
          latestBlock > blocksPer24Hours
            ? latestBlock - blocksPer24Hours
            : BigInt(0);

        /*
         * ------------------------------------------------
         * 2. Analyze every pool
         * ------------------------------------------------
         */

        const results = await Promise.all(
          pools.map(async (pool) => {
            try {
              const logs = await client.getLogs({
                address: pool.address,
                event: parseAbiItem(
                  "event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)",
                ),
                fromBlock,
                toBlock: latestBlock,
              });

              /*
               * Only keep actual Swap events.
               */
              const swapLogs = logs.filter(
                (log) => log.topics[0] === SWAP_EVENT_SIGNATURE,
              );

              let volume24hUsd = 0;

              for (const log of swapLogs) {
                const decoded = decodeEventLog({
                  abi: bdexV2PairAbi,

                  data: log.data,

                  topics: log.topics,

                  eventName: "Swap",
                });

                const args = decoded.args;

                /*
                 * BDEX / Uniswap-style
                 * swaps contain both input
                 * and output amounts.
                 *
                 * We use the input side
                 * to measure volume.
                 */

                if (args.amount0In > 0n) {
                  const amount0 =
                    Number(args.amount0In) / 10 ** pool.token0Decimals;

                  volume24hUsd += amount0 * pool.token0Price;
                }

                if (args.amount1In > 0n) {
                  const amount1 =
                    Number(args.amount1In) / 10 ** pool.token1Decimals;

                  volume24hUsd += amount1 * pool.token1Price;
                }
              }

              const fees24hUsd = volume24hUsd * 0.003;

              return {
                poolAddress: pool.address,

                swapCount24h: swapLogs.length,

                volume24hUsd,

                fees24hUsd,

                isLoading: false,

                isError: false,
              };
            } catch (error) {
              console.error(
                `Failed to load activity for ${pool.address}:`,
                error,
              );

              return {
                poolAddress: pool.address,

                swapCount24h: 0,

                volume24hUsd: 0,

                fees24hUsd: 0,

                isLoading: false,

                isError: true,
              };
            }
          }),
        );

        setActivity(results);
      } catch (error) {
        console.error("Failed to load BDEX pool activity:", error);

        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadActivity();
  }, [
    JSON.stringify(
      pools.map((pool) => ({
        address: pool.address,
        token0Decimals: pool.token0Decimals,
        token1Decimals: pool.token1Decimals,
        token0Price: pool.token0Price,
        token1Price: pool.token1Price,
      })),
    ),
  ]);

  return {
    activity,

    isLoading,

    isError,
  };
}
