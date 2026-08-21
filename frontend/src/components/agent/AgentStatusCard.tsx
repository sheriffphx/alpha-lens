"use client";

import { useState } from "react";

type Props = {
  policyId: number;
};

export function AgentStatusCard({ policyId }: Props) {
  const [paused, setPaused] = useState(false);

  async function pauseAgent() {
    try {
      const res = await fetch("/api/agent/pause", {
        method: "POST",
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      setPaused(true);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to pause agent");
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/50">AlphaLens Agent</p>

          <div className="mt-1 flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                paused ? "bg-red-400" : "bg-green-400"
              }`}
            />

            <span className="font-semibold">
              {paused ? "PAUSED" : "ACTIVE"}
            </span>
          </div>
        </div>

        <span className="rounded-lg border border-white/10 px-3 py-1 text-xs text-white/50">
          Policy #{policyId}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/[0.04] p-3">
          <p className="text-xs text-white/40">Max trade</p>
          <p className="mt-1 font-semibold">10 USDT</p>
        </div>

        <div className="rounded-xl bg-white/[0.04] p-3">
          <p className="text-xs text-white/40">Max slippage</p>
          <p className="mt-1 font-semibold">1%</p>
        </div>

        <div className="rounded-xl bg-white/[0.04] p-3">
          <p className="text-xs text-white/40">Min opportunity</p>
          <p className="mt-1 font-semibold">70</p>
        </div>

        <div className="rounded-xl bg-white/[0.04] p-3">
          <p className="text-xs text-white/40">Cooldown</p>
          <p className="mt-1 font-semibold">24h</p>
        </div>
      </div>

      {!paused && (
        <button
          onClick={pauseAgent}
          className="mt-5 w-full rounded-xl border border-red-400/30 px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-400/10"
        >
          Pause Agent
        </button>
      )}
    </section>
  );
}
