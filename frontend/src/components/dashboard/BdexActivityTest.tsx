"use client";

import { useBdexActivity } from "@/hooks/useBdexActivity";
import type { Address } from "viem";

type Props = {
  poolAddress: Address;
  token0Decimals: number;
  token1Decimals: number;
  token0PriceUsd: number;
  token1PriceUsd: number;
};

export function BdexActivityTest({
  poolAddress,
  token0Decimals,
  token1Decimals,
  token0PriceUsd,
  token1PriceUsd,
}: Props) {
  const { swaps, swapCount, volumeUsd, estimatedFeesUsd, isLoading, isError } =
    useBdexActivity({
      poolAddress,
      token0Decimals,
      token1Decimals,
      token0PriceUsd,
      token1PriceUsd,
    });

  if (isLoading) {
    return (
      <div className="rounded-2xl border p-6">
        <p className="text-sm text-gray-500">Loading BDEX activity...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border p-6">
        <p className="text-sm text-red-500">Failed to load BDEX activity.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border p-6">
      <p className="text-sm text-gray-500">BDEX Activity</p>

      <div className="mt-5 grid grid-cols-3 gap-4">
        {/* Swap count */}
        <div>
          <p className="text-xs text-gray-500">24H Swaps</p>

          <p className="mt-1 text-2xl font-semibold">{swapCount}</p>
        </div>

        {/* Volume */}
        <div>
          <p className="text-xs text-gray-500">24H Volume</p>

          <p className="mt-1 text-2xl font-semibold">
            $
            {volumeUsd.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        {/* Fees */}
        <div>
          <p className="text-xs text-gray-500">24H Estimated Fees</p>

          <p className="mt-1 text-2xl font-semibold">
            $
            {estimatedFeesUsd.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      {swaps.length > 0 && (
        <div className="mt-6 rounded-xl border p-4">
          <p className="text-sm font-medium">First Swap Debug</p>

          <p className="mt-2 text-xs text-gray-500">
            Amount 0 In: {swaps[0].amount0In.toString()}
          </p>

          <p className="text-xs text-gray-500">
            Amount 1 In: {swaps[0].amount1In.toString()}
          </p>

          <p className="text-xs text-gray-500">
            Amount 0 Out: {swaps[0].amount0Out.toString()}
          </p>

          <p className="text-xs text-gray-500">
            Amount 1 Out: {swaps[0].amount1Out.toString()}
          </p>

          <p className="mt-2 text-xs font-medium">
            Calculated Swap Volume: ${swaps[0].volumeUsd}
          </p>
        </div>
      )}
    </div>
  );
}
