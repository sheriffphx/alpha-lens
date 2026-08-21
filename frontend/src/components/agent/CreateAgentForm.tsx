"use client";

import { useEffect, useRef, useState } from "react";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
  useChainId,
} from "wagmi";
import { decodeEventLog, parseUnits } from "viem";
import { getAlphaLensExecutor } from "@/lib/alphaLensExecutor";
import { agentExecutorAbi } from "@/lib/agentExecutorAbi";

const TOKEN_CONFIG = {
  968: {
    USDT: "0x75edC9335175Fc0552D51D48439F229c10420fe3" as `0x${string}`,
    WBOT: "0xD5452816194a3784dBa983426cCe7c122F4abd30" as `0x${string}`,
  },

  677: {
    USDT: "0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C" as `0x${string}`,
    WBOT: "0xD5452816194a3784dBa983426cCe7c122F4abd30" as `0x${string}`,
  },
} as const;

const erc20Abi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export function CreateAgentForm() {
  const { address } = useAccount();
  const chainId = useChainId();

  const [maxAmount, setMaxAmount] = useState("10");
  const [slippage, setSlippage] = useState("1");
  const [minScore, setMinScore] = useState("70");
  const [cooldown, setCooldown] = useState("24");
  const [expiry, setExpiry] = useState("7");

  const pendingApprovalAmount = useRef<bigint | null>(null);

  const {
    writeContract,
    data: hash,
    isPending,
    error,
  } = useWriteContract();

  const {
    data: receipt,
    isLoading: confirming,
    isSuccess,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: approvePending,
    error: approveError,
  } = useWriteContract();

  const {
    isLoading: approveConfirming,
    isSuccess: approveSuccess,
  } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const supportedChain =
    chainId === 968 || chainId === 677;

  const tokenConfig = supportedChain
    ? TOKEN_CONFIG[chainId as 968 | 677]
    : null;

  const executor = supportedChain
    ? getAlphaLensExecutor(chainId)
    : null;

  useEffect(() => {
    if (!isSuccess || !receipt || !tokenConfig || !executor) return;

    window.dispatchEvent(
      new Event("alphalens-policy-created"),
    );

    try {
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: agentExecutorAbi,
            data: log.data,
            topics: log.topics,
            eventName: "PolicyCreated",
          });

          if (decoded.eventName === "PolicyCreated") {
            const policyId = decoded.args.policyId.toString();

            localStorage.setItem(
              "alphalens_policy_id",
              policyId,
            );

            console.log(
              "Created AlphaLens Policy:",
              policyId,
            );

            break;
          }
        } catch {
          // Not our event.
        }
      }
    } catch (err) {
      console.error(
        "Failed to extract policy ID:",
        err,
      );
    }

    /*
     * Approve the SAME chain's USDT to the SAME chain's executor.
     */
    if (pendingApprovalAmount.current !== null) {
      writeApprove({
        address: tokenConfig.USDT,
        abi: erc20Abi,
        functionName: "approve",
        args: [
          executor,
          pendingApprovalAmount.current,
        ],
      });
    }
  }, [
    isSuccess,
    receipt,
    writeApprove,
    tokenConfig,
    executor,
  ]);

  function createAgent() {
    if (!address) {
      alert("Connect your wallet first.");
      return;
    }

    if (!supportedChain || !tokenConfig || !executor) {
      alert(
        "Unsupported chain. Please connect to BOT Chain Testnet or BOT Chain Mainnet.",
      );
      return;
    }

    const agentAddress =
      process.env.NEXT_PUBLIC_AGENT_ADDRESS as
        | `0x${string}`
        | undefined;

    if (!agentAddress) {
      alert("Agent address is not configured.");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(agentAddress)) {
      alert("Invalid agent address.");
      return;
    }

    /*
     * USDT uses 6 decimals on both supported chains.
     */
    const amount = parseUnits(
      maxAmount || "0",
      6,
    );

    const maxSlippageBps =
      BigInt(
        Math.round(
          Number(slippage || "0") * 100,
        ),
      );

    const minOpportunityScore =
      BigInt(
        Math.round(
          Number(minScore || "0"),
        ),
      );

    const cooldownSeconds =
      BigInt(
        Math.round(
          Number(cooldown || "0"),
        ),
      ) *
      60n *
      60n;

    const expirySeconds =
      BigInt(
        Math.round(
          Number(expiry || "0"),
        ),
      ) *
      24n *
      60n *
      60n;

    const expiryTimestamp =
      BigInt(
        Math.floor(Date.now() / 1000),
      ) + expirySeconds;

    /*
     * Remember exactly what was approved.
     */
    pendingApprovalAmount.current = amount;

    console.log("Creating AlphaLens policy:", {
      chainId,
      executor,
      USDT: tokenConfig.USDT,
      WBOT: tokenConfig.WBOT,
      amount: amount.toString(),
    });

    /*
     * Create policy using the executor for the CURRENT chain
     * and tokens for the CURRENT chain.
     */
    writeContract({
      address: executor,
      abi: agentExecutorAbi,
      functionName: "createPolicy",
      args: [
        agentAddress,
        tokenConfig.USDT,
        tokenConfig.WBOT,
        amount,
        maxSlippageBps,
        minOpportunityScore,
        cooldownSeconds,
        expiryTimestamp,
      ],
    });
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div>
        <p className="text-lg font-semibold">
          Create AlphaLens Agent
        </p>

        <p className="mt-1 text-sm text-white/50">
          Define exactly what your agent is allowed to do.
        </p>
      </div>

      {!supportedChain && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          Unsupported network. Connect to BOT Chain
          Testnet or BOT Chain Mainnet.
        </div>
      )}

      {supportedChain && tokenConfig && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs text-white/50">
          <div>
            Network:{" "}
            <span className="text-white">
              {chainId === 677
                ? "BOT Chain Mainnet"
                : "BOT Chain Testnet"}
            </span>
          </div>

          <div className="mt-1 break-all">
            USDT: {tokenConfig.USDT}
          </div>

          <div className="mt-1 break-all">
            WBOT: {tokenConfig.WBOT}
          </div>

          <div className="mt-1 break-all">
            Executor: {executor}
          </div>
        </div>
      )}

      <div className="mt-6 space-y-5">
        <div>
          <label className="text-sm text-white/60">
            Capital
          </label>

          <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
            USDT
          </div>
        </div>

        <div>
          <label className="text-sm text-white/60">
            Allowed destination
          </label>

          <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
            WBOT
          </div>
        </div>

        <div>
          <label className="text-sm text-white/60">
            Maximum trade
          </label>

          <input
            value={maxAmount}
            onChange={(e) =>
              setMaxAmount(e.target.value)
            }
            type="number"
            min="0"
            step="0.01"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none"
          />

          <p className="mt-1 text-xs text-white/40">
            Maximum USDT per execution
          </p>
        </div>

        <div>
          <label className="text-sm text-white/60">
            Maximum slippage
          </label>

          <input
            value={slippage}
            onChange={(e) =>
              setSlippage(e.target.value)
            }
            type="number"
            min="0"
            max="100"
            step="0.1"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none"
          />

          <p className="mt-1 text-xs text-white/40">
            Percentage
          </p>
        </div>

        <div>
          <label className="text-sm text-white/60">
            Minimum opportunity score
          </label>

          <input
            value={minScore}
            onChange={(e) =>
              setMinScore(e.target.value)
            }
            type="number"
            min="0"
            max="100"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none"
          />

          <p className="mt-1 text-xs text-white/40">
            Agent cannot execute below this score
          </p>
        </div>

        <div>
          <label className="text-sm text-white/60">
            Cooldown
          </label>

          <input
            value={cooldown}
            onChange={(e) =>
              setCooldown(e.target.value)
            }
            type="number"
            min="0"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none"
          />

          <p className="mt-1 text-xs text-white/40">
            Hours between executions
          </p>
        </div>

        <div>
          <label className="text-sm text-white/60">
            Policy expiry
          </label>

          <input
            value={expiry}
            onChange={(e) =>
              setExpiry(e.target.value)
            }
            type="number"
            min="1"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none"
          />

          <p className="mt-1 text-xs text-white/40">
            Days until policy expires
          </p>
        </div>

        <button
          onClick={createAgent}
          disabled={
            !address ||
            !supportedChain ||
            isPending ||
            confirming ||
            approvePending ||
            approveConfirming
          }
          className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending
            ? "Confirm transaction..."
            : confirming
              ? "Creating policy..."
              : approvePending
                ? "Confirm allowance..."
                : approveConfirming
                  ? "Approving spend limit..."
                  : "Create Agent Policy"}
        </button>

        {hash && (
          <p className="break-all text-xs text-white/40">
            Policy tx: {hash}
          </p>
        )}

        {approveHash && (
          <p className="break-all text-xs text-white/40">
            Approval tx: {approveHash}
          </p>
        )}

        {isSuccess && !approveSuccess && (
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm">
            <p className="font-medium text-yellow-400">
              Policy created — approve the spend limit
              to finish.
            </p>

            <p className="mt-1 text-white/50">
              Confirm the second wallet prompt so the
              agent can pull funds when it executes.
            </p>
          </div>
        )}

        {isSuccess && approveSuccess && (
          <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm">
            <p className="font-medium text-green-400">
              Agent policy created and funded.
            </p>

            <p className="mt-1 text-white/50">
              Your AlphaLens agent can now execute
              within these limits.
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {error.message}
          </div>
        )}

        {approveError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            Approval failed: {approveError.message}
          </div>
        )}
      </div>
    </section>
  );
}