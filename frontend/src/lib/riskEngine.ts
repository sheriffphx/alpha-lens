import type { Portfolio } from "@/types/portfolio";
import type { PortfolioRisk, RiskFinding } from "@/types/risk";

export function analyzePortfolioRisk(portfolio: Portfolio): PortfolioRisk {
  const findings: RiskFinding[] = [];

  /*
   * 1. Concentration Risk
   */

  for (const asset of portfolio.assets) {
    if (asset.allocation >= 80) {
      findings.push({
        type: "concentration",
        level: "high",
        title: "High concentration risk",
        description: `${asset.symbol} represents ${asset.allocation.toFixed(
          1,
        )}% of your portfolio.`,
        asset: asset.symbol,
        allocation: asset.allocation,
      });
    } else if (asset.allocation >= 60) {
      findings.push({
        type: "concentration",
        level: "medium",
        title: "Significant concentration",
        description: `${asset.symbol} represents ${asset.allocation.toFixed(
          1,
        )}% of your portfolio.`,
        asset: asset.symbol,
        allocation: asset.allocation,
      });
    }
  }

  /*
   * 2. Idle Capital
   *
   * For now, USDT sitting directly in the wallet
   * is considered idle.
   */

  const usdt = portfolio.assets.find((asset) => asset.symbol === "USDT");

  if (usdt && usdt.allocation >= 50) {
    findings.push({
      type: "idle-capital",
      level: "medium",
      title: "Large amount of idle capital",
      description: `${usdt.allocation.toFixed(
        1,
      )}% of your portfolio is held as USDT in your wallet.`,
      asset: "USDT",
      allocation: usdt.allocation,
    });
  }

  /*
   * 3. Calculate overall score
   */

  let score = 0;

  for (const finding of findings) {
    if (finding.level === "high") {
      score += 40;
    }

    if (finding.level === "medium") {
      score += 20;
    }
  }

  score = Math.min(score, 100);

  let level: PortfolioRisk["level"] = "low";

  if (score >= 60) {
    level = "high";
  } else if (score >= 30) {
    level = "medium";
  }

  return {
    score,
    level,
    findings,
  };
}
