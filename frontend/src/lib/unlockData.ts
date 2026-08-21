export type UnlockEvent = {
  id: string;
  token: string;
  type: "token" | "protocol";
  amountUsd: number;
  unlockDate: string;
  description: string;
  risk: "low" | "moderate" | "high";
};

export const unlockEvents: UnlockEvent[] = [];
