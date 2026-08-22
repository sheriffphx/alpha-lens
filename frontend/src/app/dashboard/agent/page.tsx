"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useSignMessage, useChainId } from "wagmi";
import { NETWORK_CONFIG } from "@/lib/constants";

import { usePortfolio } from "@/hooks/usePortfolio";

import { AgentActivity } from "@/components/agent/AgentActivity";
import { AgentHistory } from "@/components/agent/AgentHistory";
import { PauseAgentButton } from "@/components/agent/PauseAgentButton";
import { ResumeAgentButton } from "@/components/agent/ResumeAgentButton";
import { CreateAgentForm } from "@/components/agent/CreateAgentForm";

type PolicySummary = {
  policyId: number;
  owner: string;
  agent: string;
  tokenIn: string;
  tokenOut: string;
  maxAmount: string;
  maxSlippageBps: number;
  minOpportunityScore: number;
  cooldown: string;
  lastExecuted: string;
  expiry: string;
  active: boolean;
};

type AgentRunResult = {
  success: boolean;
  status?: string;
  stage?: string;

  decision?: {
    action: string;
    amountIn?: string;
    confidence?: number;
    reason?: string;
    evidenceHash?: string;
  };

  execution?: {
    decisionId?: string;
    transactionHash?: string;
    quotedOutput?: string;
    amountOutMin?: string;
    policyId?: number;
  };

  transactionHash?: string;
  error?: string;
};

function buildAuthMessage(policyId: number, timestamp: number) {
  return `AlphaLens: run policy #${policyId} at ${timestamp}`;
}

export default function AgentPage() {
  const router = useRouter();
  const chainId = useChainId();
  const config = NETWORK_CONFIG[chainId as keyof typeof NETWORK_CONFIG];

  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const { isConnected, isConnecting } = usePortfolio();

  const [policies, setPolicies] = useState<PolicySummary[]>([]);

  // Result for EACH individual agent.
  const [agentResults, setAgentResults] = useState<
    Record<number, AgentRunResult>
  >({});

  // IDs of agents currently being run.
  const [runningPolicies, setRunningPolicies] = useState<Set<number>>(
    new Set(),
  );

  const [loadingPolicies, setLoadingPolicies] = useState(false);

  /*
   * Redirect disconnected users.
   */
  useEffect(() => {
    if (!isConnecting && !isConnected) {
      router.push("/");
    }
  }, [isConnected, isConnecting, router]);

  /*
   * Load user's policies.
   */
  async function loadPolicies() {
    if (!address || !config) {
      setPolicies([]);
      return;
    }

    setLoadingPolicies(true);

    try {
      const response = await fetch(
        `/api/agent/policies?account=${address}&chainId=${chainId}`,
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (data.success) {
        setPolicies(data.policies ?? []);
      } else {
        setPolicies([]);
      }
    } catch (error) {
      console.error("Failed to load policies:", error);
      setPolicies([]);
    } finally {
      setLoadingPolicies(false);
    }
  }

  useEffect(() => {
    loadPolicies();

    window.addEventListener("alphalens-policy-created", loadPolicies);

    return () => {
      window.removeEventListener("alphalens-policy-created", loadPolicies);
    };
  }, [address]);

  /*
   * Run ONE specific agent.
   *
   * Agent #1 can be running while Agent #2 remains paused/stopped.
   */
  async function runAgent(policyId: number) {
    if (!address) {
      alert("Connect your wallet first.");
      return;
    }

    /*
     * Mark ONLY this policy as running.
     */
    setRunningPolicies((prev) => {
      const next = new Set(prev);
      next.add(policyId);
      return next;
    });

    /*
     * Clear ONLY this agent's previous result.
     */
    setAgentResults((prev) => {
      const next = { ...prev };
      delete next[policyId];
      return next;
    });

    try {
      const timestamp = Date.now();

      const message = buildAuthMessage(policyId, timestamp);

      /*
       * Prove that the connected wallet owns this policy.
       */
      const signature = await signMessageAsync({
        message,
      });

      const response = await fetch("/api/agent/run", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          policyId,
          timestamp,
          signature,
          chainId,
        }),
      });

      const data: AgentRunResult = await response.json();

      /*
       * Store result against THIS policy.
       */
      setAgentResults((prev) => ({
        ...prev,
        [policyId]: data,
      }));

      /*
       * Refresh policies.
       */
      await loadPolicies();
    } catch (error) {
      console.error("Agent run failed:", error);

      setAgentResults((prev) => ({
        ...prev,
        [policyId]: {
          success: false,
          stage: "agent",
          error: error instanceof Error ? error.message : "Failed to run agent",
        },
      }));
    } finally {
      /*
       * Stop ONLY this agent's loading state.
       */
      setRunningPolicies((prev) => {
        const next = new Set(prev);
        next.delete(policyId);
        return next;
      });
    }
  }

  function getResult(policyId: number) {
    return agentResults[policyId];
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-10">
      {/* HEADER */}
      <header className="mb-6">
        <p className="font-mono text-xs tracking-[0.18em] text-[#00D4FF]">
          AGENT
        </p>

        <h1 className="mt-2 text-3xl font-semibold">AlphaLens Agent</h1>

        <p className="mt-2 text-sm text-white/55">
          Autonomous portfolio execution under your predefined mandates.
        </p>
      </header>

      {/* CREATE AGENT */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <CreateAgentForm />
      </section>

      {/* AGENTS */}
      <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-semibold">Your Agents</p>

            <p className="mt-1 text-sm text-white/45">
              Each mandate operates independently.
            </p>
          </div>

          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/40">
            {loadingPolicies ? "Refreshing" : `${policies.length} agents`}
          </span>
        </div>

        {policies.length === 0 ? (
          !config ? (
            <div className="mt-6 rounded-xl border border-dashed border-red-400/20 p-6 text-center text-red-400">
              Please switch to a supported network to view your agents.
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-white/10 p-6 text-center">
              <p className="text-sm text-white/40">No agents created yet.</p>
            </div>
          )
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {policies.map((policy) => {
              const result = getResult(policy.policyId);

              const isRunning = runningPolicies.has(policy.policyId);

              const transactionHash =
                result?.transactionHash ?? result?.execution?.transactionHash;

              return (
                <div
                  key={policy.policyId}
                  className="rounded-xl border border-white/10 bg-black/20 p-5"
                >
                  {/* TITLE */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold">
                        AlphaLens Agent #{policy.policyId}
                      </p>

                      <p className="mt-1 font-mono text-[11px] text-white/35">
                        {policy.tokenIn} → {policy.tokenOut}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        isRunning
                          ? "animate-pulse bg-blue-400/10 text-blue-400"
                          : policy.active
                            ? "bg-green-400/10 text-green-400"
                            : "bg-red-400/10 text-red-400"
                      }`}
                    >
                      {isRunning
                        ? "RUNNING..."
                        : policy.active
                          ? "ACTIVE"
                          : "PAUSED"}
                    </span>
                  </div>

                  {/* MANDATE */}
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/35">
                        Maximum trade
                      </p>

                      <p className="mt-1 text-sm">
                        {(Number(policy.maxAmount) / 1_000_000).toFixed(2)} USDT
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/35">
                        Min opportunity
                      </p>

                      <p className="mt-1 text-sm">
                        {policy.minOpportunityScore}/100
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/35">
                        Max slippage
                      </p>

                      <p className="mt-1 text-sm">
                        {(policy.maxSlippageBps / 100).toFixed(2)}%
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/35">
                        Cooldown
                      </p>

                      <p className="mt-1 text-sm">
                        {Number(policy.cooldown) / 3600}h
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/35">
                        Expires
                      </p>

                      <p className="mt-1 text-sm">
                        {new Date(
                          Number(policy.expiry) * 1000,
                        ).toLocaleDateString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/35">
                        Last execution
                      </p>

                      <p className="mt-1 text-sm">
                        {(() => {
                          const ts = Number(policy.lastExecuted);

                          return !policy.lastExecuted ||
                            Number.isNaN(ts) ||
                            ts === 0
                            ? "Never"
                            : new Date(ts * 1000).toLocaleString();
                        })()}
                      </p>
                    </div>
                  </div>

                  <AgentActivity result={result} />
                  {/* ACTIONS */}
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={() => runAgent(policy.policyId)}
                      disabled={isRunning || !policy.active}
                      className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isRunning ? "Running..." : "Run Agent"}
                    </button>

                    <PauseAgentButton policyId={policy.policyId} />
                    <ResumeAgentButton policyId={policy.policyId} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ACTIVITY */}

      {/* HISTORY */}
      <section className="mt-5">
        <AgentHistory />
      </section>
    </main>
  );
}
