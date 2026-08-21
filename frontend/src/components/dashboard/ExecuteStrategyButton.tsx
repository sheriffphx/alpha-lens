"use client";

import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";

import { parseUnits } from "viem";

import { alphaLensExecutor } from "@/lib/alphaLensExecutor";
import { alphaLensExecutorAbi } from "@/lib/alphaLensExecutorAbi";
import { erc20Abi } from "@/lib/erc20Abi";
import { useChainId } from "wagmi";
import { getAlphaLensExecutor } from "@/lib/alphaLensExecutor";

type ExecuteStrategyButtonProps = {
  tokenAddress: `0x${string}`;
  tokenDecimals: number;
  amount: string;
  path: `0x${string}`[];
};

export function ExecuteStrategyButton({
  tokenAddress,
  tokenDecimals,
  amount,
  path,
}: ExecuteStrategyButtonProps) {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  const executor = getAlphaLensExecutor(chainId);

  if (!executor) {
    console.error("Alpha Lens executor is not deployed on this network.");
    return;
  }

  const {
    data: approvalHash,
    writeContract: writeApproval,
    isPending: approvalPending,
    error: approvalError,
  } = useWriteContract();

  const {
    data: swapHash,
    writeContract: writeSwap,
    isPending: swapPending,
    error: swapError,
  } = useWriteContract();

  const { isLoading: approvalConfirming } = useWaitForTransactionReceipt({
    hash: approvalHash,
  });

  const { isLoading: swapConfirming } = useWaitForTransactionReceipt({
    hash: swapHash,
  });

  if (!isConnected) {
    return (
      <button
        disabled
        className="rounded-xl bg-gray-200 px-5 py-3 text-sm font-semibold text-gray-500"
      >
        Connect wallet
      </button>
    );
  }

  const approve = () => {
    const amountIn = parseUnits(amount, tokenDecimals);

    writeApproval({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "approve",
      args: [executor, amountIn],
    });
  };

  const executeSwap = () => {
    const amountIn = parseUnits(amount, tokenDecimals);

    const deadline = BigInt(Math.floor(Date.now() / 1000)) + BigInt(20 * 60);

    writeSwap({
      address: executor,
      abi: alphaLensExecutorAbi,
      functionName: "executeSwap",
      args: [tokenAddress, amountIn, BigInt(0), path, deadline],
    });
  };

  const approvalComplete =
    !!approvalHash && !approvalPending && !approvalConfirming;

  return (
    <div className="space-y-3">
      {/* APPROVAL */}
      {!approvalComplete && !swapHash && (
        <button
          onClick={approve}
          disabled={approvalPending || approvalConfirming}
          className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {approvalPending
            ? "Confirm approval in wallet..."
            : approvalConfirming
              ? "Confirming approval..."
              : "Approve & Continue"}
        </button>
      )}

      {/* SWAP */}
      {approvalComplete && !swapHash && (
        <button
          onClick={executeSwap}
          disabled={swapPending}
          className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {swapPending ? "Confirm swap in wallet..." : "Execute Strategy"}
        </button>
      )}

      {/* SWAP CONFIRMING */}
      {swapConfirming && (
        <p className="text-sm text-gray-500">
          Executing strategy on BOT Chain...
        </p>
      )}

      {/* SUCCESS */}
      {swapHash && !swapConfirming && (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-green-600">
            Strategy executed successfully ✓
          </p>

          <p className="break-all text-xs text-gray-500">
            Transaction: {swapHash}
          </p>
        </div>
      )}

      {/* ERRORS */}
      {approvalError && (
        <p className="text-sm text-red-500">
          Approval failed: {approvalError.message}
        </p>
      )}

      {swapError && (
        <p className="text-sm text-red-500">Swap failed: {swapError.message}</p>
      )}
    </div>
  );
}
