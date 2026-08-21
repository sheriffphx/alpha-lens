"use client";

import { useEffect, useState } from "react";
import {
  createPublicClient,
  decodeEventLog,
  http,
  parseAbiItem,
  type Address,
  keccak256,
  toBytes,
} from "viem";

import { botChain } from "@/lib/wagmi";
import { bdexV2PairAbi } from "@/lib/bdexV2Abi";

type SwapEvent = {
  transactionHash: string;
  blockNumber: bigint;

  amount0In: bigint;
  amount1In: bigint;
  amount0Out: bigint;
  amount1Out: bigint;

  volumeUsd: number;
};

type UseBdexActivityOptions = {
  poolAddress?: Address;

  token0Decimals: number;
  token1Decimals: number;

  token0PriceUsd: number;
  token1PriceUsd: number;
};

export function useBdexActivity({
  poolAddress,
  token0Decimals,
  token1Decimals,
  token0PriceUsd,
  token1PriceUsd,
}: UseBdexActivityOptions) {
  const [swaps, setSwaps] = useState<SwapEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!poolAddress) {
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

        const latestBlock = await client.getBlockNumber();

        const latestBlockData = await client.getBlock({
          blockNumber: latestBlock,
        });

        const sampleBlocks = BigInt(100);

        const earlierBlockNumber =
          latestBlock > sampleBlocks ? latestBlock - sampleBlocks : BigInt(0);

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

        const logs = await client.getLogs({
          address: poolAddress,
          event: parseAbiItem(
            "event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)",
          ),
          fromBlock,
          toBlock: latestBlock,
        });

        const SWAP_EVENT_SIGNATURE = keccak256(
          toBytes("Swap(address,uint256,uint256,uint256,uint256,address)"),
        );

        const swapLogs = logs.filter(
          (log) => log.topics[0] === SWAP_EVENT_SIGNATURE,
        );

        const formattedSwaps: SwapEvent[] = swapLogs.map((log) => {
          const decoded = decodeEventLog({
            abi: bdexV2PairAbi,
            data: log.data,
            topics: log.topics,
            eventName: "Swap",
          });

          const args = decoded.args;

          const amount0In = args.amount0In;

          const amount1In = args.amount1In;

          const amount0Out = args.amount0Out;

          const amount1Out = args.amount1Out;

          let volumeUsd = 0;

          if (amount0In > 0n) {
            const amount = Number(amount0In) / 10 ** token0Decimals;

            volumeUsd = amount * token0PriceUsd;
          } else if (amount1In > 0n) {
            const amount = Number(amount1In) / 10 ** token1Decimals;

            volumeUsd = amount * token1PriceUsd;
          }

          return {
            transactionHash: log.transactionHash,

            blockNumber: log.blockNumber,

            amount0In,
            amount1In,
            amount0Out,
            amount1Out,

            volumeUsd,
          };
        });

        setSwaps(formattedSwaps);
      } catch (error) {
        console.error("Failed to load BDEX activity:", error);

        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadActivity();
  }, [
    poolAddress,
    token0Decimals,
    token1Decimals,
    token0PriceUsd,
    token1PriceUsd,
  ]);

  const volumeUsd = swaps.reduce((total, swap) => total + swap.volumeUsd, 0);

  const estimatedFeesUsd = volumeUsd * 0.003;

  return {
    swaps,

    swapCount: swaps.length,

    volumeUsd,

    estimatedFeesUsd,

    observationHours: 24,

    isLoading,

    isError,
  };
}
