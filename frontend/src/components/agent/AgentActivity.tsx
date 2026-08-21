"use client";

type AgentDecision = {
  action: string;
  amountIn?: string;
  confidence?: number;
  reason?: string;
  evidenceHash?: string;
};

type AgentExecution = {
  decisionId?: string;
  transactionHash?: string;
  quotedOutput?: string;
  amountOutMin?: string;
  policyId?: number;
};

type AgentRunResult = {
  success: boolean;
  status?: string;
  stage?: string;
  decision?: AgentDecision;
  execution?: AgentExecution;
  transactionHash?: string;
  error?: string;
};

type AgentActivityProps = {
  result?: AgentRunResult;
};

export function AgentActivity({ result }: AgentActivityProps) {
  const transactionHash =
    result?.transactionHash ?? result?.execution?.transactionHash;

  const decisionId = result?.execution?.decisionId;

  const confidence = result?.decision?.confidence;

  const amountIn = result?.decision?.amountIn;

  const action = result?.decision?.action;

  const reason = result?.decision?.reason;

  /*
   * No agent has been run yet.
   */
  if (!result) {
    return (
      <div className="mt-5 rounded-xl border border-dashed border-white/10 p-5">
        <p className="text-xs uppercase tracking-[0.14em] text-white/35">
          AI Decision
        </p>

        <p className="mt-2 text-sm text-white/40">
          Run the agent to generate an AI decision.
        </p>
      </div>
    );
  }

  /*
   * Agent failed.
   */
  if (!result.success) {
    return (
      <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-300">
          Agent Error
        </p>

        <p className="mt-2 text-sm leading-6 text-red-200/70">
          {result.error ?? "The agent failed to complete its run."}
        </p>
      </div>
    );
  }

  const isHold =
    action?.toLowerCase() === "hold" || result.status?.toLowerCase() === "hold";

  return (
    <div
      className={`mt-5 rounded-xl border p-5 ${
        isHold
          ? "border-yellow-400/20 bg-yellow-400/5"
          : "border-green-400/20 bg-green-400/5"
      }`}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-white/40">
            AI Decision
          </p>

          <p className="mt-2 text-xl font-semibold uppercase">
            {action ?? result.status ?? "UNKNOWN"}
          </p>
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            isHold
              ? "bg-yellow-400/10 text-yellow-300"
              : "bg-green-400/10 text-green-300"
          }`}
        >
          {isHold ? "NO TRADE" : "ACTION"}
        </span>
      </div>

      {/* DECISION DATA */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/35">
            Amount
          </p>

          <p className="mt-1 text-sm text-white/80">
            {amountIn
              ? `${(Number(amountIn) / 1_000_000).toFixed(2)} USDT`
              : "—"}
          </p>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/35">
            Confidence
          </p>

          <p className="mt-1 text-sm text-white/80">
            {typeof confidence === "number"
              ? `${(confidence * 100).toFixed(0)}%`
              : "—"}
          </p>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/35">
            Decision ID
          </p>

          <p className="mt-1 truncate font-mono text-xs text-white/60">
            {decisionId ?? "—"}
          </p>
        </div>
      </div>

      {/* AI REASON */}
      {reason && (
        <div className="mt-5">
          <p className="text-[10px] uppercase tracking-wider text-white/35">
            Agent reasoning
          </p>

          <p className="mt-2 text-sm leading-6 text-white/55">{reason}</p>
        </div>
      )}

      {/* EVIDENCE */}
      {result.decision?.evidenceHash && (
        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-wider text-white/35">
            Evidence hash
          </p>

          <p className="mt-1 truncate font-mono text-xs text-white/30">
            {result.decision.evidenceHash}
          </p>
        </div>
      )}

      {/* TRANSACTION */}
      {transactionHash && (
        <a
          href={`https://scan.bohr.life/tx/${transactionHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-xs text-[#00D4FF] hover:underline"
        >
          View transaction ↗
        </a>
      )}
    </div>
  );
}