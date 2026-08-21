"use client";

import { useEffect, useState } from "react";
import {
  useAccount,
  useChainId,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

const EXECUTORS = {
  968:
    "0xF5B91F7D5a3863C244Ba4Cb9b409da9f88654DF1",
  677:
    "0xB363a61f16Ca0a69772A9a445c707D5C98590F92",
} as const;

const executorAbi = [
  {
    type: "function",
    name: "resumePolicy",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "policyId",
        type: "uint256",
      },
    ],
    outputs: [],
  },
] as const;

type ResumeAgentButtonProps = {
  policyId: number;
};

export function ResumeAgentButton({
  policyId,
}: ResumeAgentButtonProps) {
  const {
    address,
    isConnected,
  } = useAccount();

  const chainId = useChainId();

  const executor =
    EXECUTORS[
      chainId as keyof typeof EXECUTORS
    ];

  const [resumed, setResumed] =
    useState(false);

  const {
    writeContract,
    data: hash,
    isPending,
    error,
  } = useWriteContract();

  const {
    isLoading: confirming,
    isSuccess,
  } =
    useWaitForTransactionReceipt({
      hash,
    });

  function resumeAgent() {
    if (!isConnected || !address) {
      alert(
        "Connect your wallet first.",
      );
      return;
    }

    if (!executor) {
      alert(
        "Unsupported network. Switch to BOT Chain.",
      );
      return;
    }

    if (!policyId || policyId <= 0) {
      alert("Invalid policy ID.");
      return;
    }

    writeContract({
      address:
        executor as `0x${string}`,
      abi: executorAbi,
      functionName:
        "resumePolicy",
      args: [BigInt(policyId)],
    });
  }

  useEffect(() => {
    if (isSuccess) {
      setResumed(true);

      window.dispatchEvent(
        new Event(
          "alphalens-policy-updated",
        ),
      );
    }
  }, [isSuccess]);

  if (!executor) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={resumeAgent}
        disabled={
          isPending ||
          confirming ||
          resumed ||
          !isConnected
        }
        className="rounded-xl border border-green-400/30 px-4 py-2 text-sm font-medium text-green-400 transition hover:bg-green-400/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {resumed
          ? "Agent Running"
          : isPending
            ? "Confirm in wallet..."
            : confirming
              ? "Resuming..."
              : "Resume Agent"}
      </button>

      {error && (
        <span className="max-w-md text-xs text-red-300">
          {error.message}
        </span>
      )}
    </div>
  );
}