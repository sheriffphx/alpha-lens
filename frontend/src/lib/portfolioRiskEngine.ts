export type PortfolioRiskLevel = "low" | "moderate" | "high" | "critical";

export type PortfolioRisk = {
  score: number;
  level: PortfolioRiskLevel;

  reasons: string[];

  warnings: string[];
};

type PortfolioAsset = {
  symbol: string;
  valueUsd: number;
  allocation: number;
  type: "native" | "erc20";
};

export function calculatePortfolioRisk(
  assets: PortfolioAsset[],
  totalValueUsd: number,
): PortfolioRisk {
  let score = 0;

  const reasons: string[] = [];
  const warnings: string[] = [];

  if (totalValueUsd <= 0 || assets.length === 0) {
    return {
      score: 0,
      level: "low",
      reasons: ["No portfolio assets available for analysis."],
      warnings: [],
    };
  }

  /*
   * ----------------------------------------
   * 1. Concentration risk
   * ----------------------------------------
   */

  const sortedAssets = [...assets].sort((a, b) => b.allocation - a.allocation);

  const largestAsset = sortedAssets[0];

  if (largestAsset.allocation >= 80) {
    score += 40;

    reasons.push(
      `${largestAsset.symbol} represents ${largestAsset.allocation.toFixed(
        1,
      )}% of your portfolio.`,
    );

    warnings.push("Very high portfolio concentration.");
  } else if (largestAsset.allocation >= 60) {
    score += 30;

    reasons.push(
      `${largestAsset.symbol} represents ${largestAsset.allocation.toFixed(
        1,
      )}% of your portfolio.`,
    );

    warnings.push("Portfolio is heavily concentrated in one asset.");
  } else if (largestAsset.allocation >= 40) {
    score += 20;

    reasons.push(
      `${largestAsset.symbol} represents ${largestAsset.allocation.toFixed(
        1,
      )}% of your portfolio.`,
    );
  }

  /*
   * ----------------------------------------
   * 2. Native asset exposure
   * ----------------------------------------
   */

  const nativeAssets = assets.filter((asset) => asset.type === "native");

  const nativeValue = nativeAssets.reduce(
    (sum, asset) => sum + asset.valueUsd,
    0,
  );

  const nativeAllocation =
    totalValueUsd > 0 ? (nativeValue / totalValueUsd) * 100 : 0;

  if (nativeAllocation >= 70) {
    score += 25;

    reasons.push(
      `${nativeAllocation.toFixed(
        1,
      )}% of your portfolio is exposed to native assets.`,
    );

    warnings.push("High exposure to native-asset price volatility.");
  } else if (nativeAllocation >= 40) {
    score += 15;

    reasons.push(
      `${nativeAllocation.toFixed(
        1,
      )}% of your portfolio is exposed to native assets.`,
    );
  }

  /*
   * ----------------------------------------
   * 3. Diversification
   * ----------------------------------------
   */

  if (assets.length === 1) {
    score += 25;

    reasons.push("Your portfolio currently contains only one asset.");

    warnings.push("Very limited diversification.");
  } else if (assets.length === 2) {
    score += 10;

    reasons.push("Your portfolio contains only two assets.");
  }

  /*
   * ----------------------------------------
   * Normalize
   * ----------------------------------------
   */

  score = Math.min(100, Math.round(score));

  /*
   * ----------------------------------------
   * Determine level
   * ----------------------------------------
   */

  let level: PortfolioRiskLevel;

  if (score >= 75) {
    level = "critical";
  } else if (score >= 50) {
    level = "high";
  } else if (score >= 25) {
    level = "moderate";
  } else {
    level = "low";
  }

  return {
    score,
    level,
    reasons,
    warnings,
  };
}
