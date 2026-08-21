export type RiskLevel = "low" | "medium" | "high";

export type RiskFinding = {
  type: "concentration" | "idle-capital";
  level: RiskLevel;
  title: string;
  description: string;
  asset?: string;
  allocation?: number;
};

export type PortfolioRisk = {
  score: number;
  level: RiskLevel;
  findings: RiskFinding[];
};
