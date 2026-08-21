"use client";

import {
  useAccount,
  useChainId,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

const EXECUTORS = {
  968: "0xF5B91F7D5a3863C244Ba4Cb9b409da9f88654DF1",
  677: "0xB363a61f16Ca0a69772A9a445c707D5C98590F92",
} as const;

const executorAbi = [
  {
    type: "function",
    name: "pausePolicy",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "policyId",
        type: "uint256",
      },
    ],
    outputs: [],
  },

  {
    type: "function",
    name: "isPolicyExecutable",
    stateMutability: "view",
    inputs: [
      {
        name: "policyId",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
  },
] as const;

type PauseAgentButtonProps = {
  policyId: number;
};

export function PauseAgentButton({ policyId }: PauseAgentButtonProps) {
  const { address, isConnected } = useAccount();

  const chainId = useChainId();

  const executor = EXECUTORS[chainId as keyof typeof EXECUTORS];

  const { data: executable, refetch } = useReadContract({
    address: executor as `0x${string}`,
    abi: executorAbi,
    functionName: "isPolicyExecutable",
    args: [BigInt(policyId)],
    query: {
      enabled: !!executor && isConnected,
    },
  });

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  async function pauseAgent() {
    if (!isConnected || !address) {
      alert("Connect your wallet first.");
      return;
    }

    if (!executor) {
      alert("Unsupported network. Switch to BOT Chain.");
      return;
    }

    writeContract({
      address: executor as `0x${string}`,
      abi: executorAbi,
      functionName: "pausePolicy",
      args: [BigInt(policyId)],
    });
  }

  if (!executor) {
    return null;
  }

  const paused = executable === false;

  if (isSuccess) {
    refetch();
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={pauseAgent}
        disabled={isPending || confirming || paused || !isConnected}
        className="rounded-xl border border-red-400/30 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-400/10 disabled:opacity-50"
      >
        {paused
          ? "Agent Paused"
          : isPending
            ? "Confirm transaction..."
            : confirming
              ? "Pausing..."
              : "Pause Agent"}
      </button>

      {error && <span className="text-xs text-red-300">{error.message}</span>}
    </div>
  );
}
