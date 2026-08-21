"use client";

import { useState } from "react";

type Props = {
  onComplete?: (result: any) => void;
};

export function RunAgentButton({ onComplete }: Props) {
  const [running, setRunning] = useState(false);

  async function runAgent() {
    if (running) return;

    setRunning(true);

    try {
      const response = await fetch("/api/agent/run", {
        method: "POST",
      });

      const result = await response.json();

      console.log("AlphaLens Agent:", result);

      onComplete?.(result);

      if (!result.success) {
        alert(result.error ?? "Agent failed");
      }
    } catch (error) {
      console.error(error);
      alert("Agent request failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <button
      onClick={runAgent}
      disabled={running}
      className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {running ? "Agent is thinking..." : "Run AlphaLens Agent"}
    </button>
  );
}
