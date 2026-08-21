export type AgentDecision = {
  action: "swap" | "hold";
  tokenIn: `0x${string}`;
  tokenOut: `0x${string}`;
  amountIn: string;
  maxSlippageBps: number;
  reason: string;
  confidence: number;
  evidenceHash: `0x${string}`;
};
