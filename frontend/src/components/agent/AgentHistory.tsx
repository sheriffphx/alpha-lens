"use client";

import { useCallback, useEffect, useState } from "react";
import { useChainId } from "wagmi";

type Activity = {
  type: string;
  blockNumber?: string;
  transactionHash?: string;
  policyId?: string;
  decisionId?: string;
  amountIn?: string;
  amountOut?: string;
};

type ActivityResponse = {
  success: boolean;
  activity?: Activity[];
  explorer?: string;
  error?: string;
};

function getTitle(type: string) {
  switch (type) {
    case "policy_created":
      return "Agent mandate created";

    case "policy_paused":
      return "Agent paused";

    case "policy_resumed":
      return "Agent resumed";

    case "decision_committed":
      return "AI decision committed";

    case "decision_executed":
      return "Agent executed trade";

    default:
      return "Agent activity";
  }
}

function getDescription(item: Activity) {
  switch (item.type) {
    case "policy_created":
      return `Policy #${item.policyId} was created on-chain.`;

    case "policy_paused":
      return `Policy #${item.policyId} was paused by the owner.`;

    case "policy_resumed":
      return `Policy #${item.policyId} was resumed.`;

    case "decision_committed":
      return "AlphaLens evaluated market conditions and committed an AI decision.";

    case "decision_executed":
      return "A policy-compliant AI decision was executed on-chain.";

    default:
      return "AlphaLens recorded an agent event.";
  }
}

function getIcon(type: string) {
  switch (type) {
    case "policy_paused":
      return "⏸";

    case "policy_resumed":
      return "▶";

    case "decision_committed":
      return "🧠";

    case "decision_executed":
      return "⚡";

    case "policy_created":
      return "🤖";

    default:
      return "•";
  }
}

export function AgentHistory() {
  const chainId = useChainId();

  const [activity, setActivity] = useState<Activity[]>([]);
  const [explorer, setExplorer] = useState("");
  const [loading, setLoading] = useState(true);

  const loadActivity = useCallback(async () => {
    if (chainId !== 968 && chainId !== 677) {
      setActivity([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`/api/agent/activity?chainId=${chainId}`, {
        cache: "no-store",
      });

      const data: ActivityResponse = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Failed to load agent history");
      }

      setActivity(data.activity ?? []);
      setExplorer(data.explorer ?? "");
    } catch (error) {
      console.error("Failed to load agent history:", error);
      setActivity([]);
    } finally {
      setLoading(false);
    }
  }, [chainId]);

  /*
   * Reload immediately whenever the connected chain changes.
   */
  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  /*
   * Keep the current chain's history live.
   */
  useEffect(() => {
    const interval = setInterval(() => {
      loadActivity();
    }, 15000);

    return () => clearInterval(interval);
  }, [loadActivity]);

  /*
   * Refresh history immediately after creating,
   * pausing or resuming an agent.
   */
  useEffect(() => {
    const refresh = () => {
      loadActivity();
    };

    window.addEventListener("alphalens-policy-created", refresh);

    window.addEventListener("alphalens-policy-updated", refresh);

    return () => {
      window.removeEventListener("alphalens-policy-created", refresh);

      window.removeEventListener("alphalens-policy-updated", refresh);
    };
  }, [loadActivity]);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold">Agent History</p>

          <p className="mt-1 text-sm text-white/40">
            Verifiable AI decisions and on-chain actions.
          </p>
        </div>

        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/40">
          {chainId === 677
            ? "BOT Chain Mainnet"
            : chainId === 968
              ? "BOT Chain Testnet"
              : "Unsupported chain"}
        </span>
      </div>

      {/* LOADING */}
      {loading ? (
        <div className="mt-6">
          <p className="text-sm text-white/40">Loading agent history...</p>
        </div>
      ) : activity.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-white/10 p-6 text-center">
          <p className="text-sm text-white/40">
            No agent activity on this chain yet.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {activity.map((item, index) => (
            <div
              key={`${item.transactionHash ?? item.decisionId ?? item.type}-${index}`}
              className="flex gap-4"
            >
              {/* ICON */}
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-sm">
                {getIcon(item.type)}
              </div>

              {/* CONTENT */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{getTitle(item.type)}</p>

                  {item.policyId && (
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/35">
                      Policy #{item.policyId}
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm leading-5 text-white/40">
                  {getDescription(item)}
                </p>

                {/* TRADE AMOUNT */}
                {item.amountIn && (
                  <p className="mt-2 text-xs text-white/35">
                    Swapped {(Number(item.amountIn) / 1_000_000).toFixed(2)}{" "}
                    USDT
                    {item.amountOut
                      ? ` → ${(Number(item.amountOut) / 1_000_000).toFixed(2)} WBOT`
                      : ""}
                  </p>
                )}

                {/* DECISION ID */}
                {item.decisionId && (
                  <p className="mt-2 truncate font-mono text-[11px] text-white/25">
                    Decision: {item.decisionId}
                  </p>
                )}

                {/* TRANSACTION */}
                {item.transactionHash && explorer && (
                  <a
                    href={`${explorer}/tx/${item.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs text-[#00D4FF] hover:underline"
                  >
                    View transaction ↗
                  </a>
                )}

                {/* BLOCK */}
                {item.blockNumber && (
                  <p className="mt-1 text-[11px] text-white/20">
                    Block {item.blockNumber}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
