"use client";

import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";

import { parseUnits } from "viem";

import { alphaLensExecutor } from "@/lib/alphaLensExecutor";
import { erc20Abi } from "@/lib/erc20Abi";
import { useChainId } from "wagmi";
import { getAlphaLensExecutor } from "@/lib/alphaLensExecutor";

type ApproveExecutorButtonProps = {
  tokenAddress: `0x${string}`;
  decimals: number;
  amount: string;
};

export function ApproveExecutorButton({
  tokenAddress,
  decimals,
  amount,
}: ApproveExecutorButtonProps) {
  const { isConnected } = useAccount();

  const chainId = useChainId();

  const executorAddress = getAlphaLensExecutor(chainId);

  if (!executorAddress) {
    console.error("Alpha Lens executor is not deployed on this network.");
    return null;
  }

  const executor = executorAddress as `0x${string}`;

  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  function approve() {
    const amountIn = parseUnits(amount, decimals);

    writeContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "approve",
      args: [executor, amountIn],
    });
  }

  if (!isConnected) {
    return <p className="text-sm text-gray-500">Connect your wallet first.</p>;
  }

  return (
    <div className="space-y-3">
      <button
        onClick={approve}
        disabled={isPending || isConfirming}
        className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isPending
          ? "Confirm in wallet..."
          : isConfirming
            ? "Confirming..."
            : isSuccess
              ? "Approved ✓"
              : `Approve ${amount}`}
      </button>

      {hash && (
        <p className="break-all text-xs text-gray-500">Transaction: {hash}</p>
      )}

      {error && <p className="text-sm text-red-500">{error.message}</p>}

      {isSuccess && (
        <p className="text-sm text-green-600">Token approved successfully.</p>
      )}
    </div>
  );
}
