export type OpportunityLevel =
  "excellent" | "good" | "moderate" | "weak" | "high-risk";

export type OpportunityScore = {
  score: number;

  level: OpportunityLevel;

  yieldScore: number;

  liquidityScore: number;

  activityScore: number;

  assetRiskScore: number;

  explanation: string;
};

type PoolForScoring = {
  tvl: number;

  feeApr: number;

  volume24hUsd: number;

  token0Symbol: string;

  token1Symbol: string;

  yieldSanity: {
    score: number;
    liquidityScore: number;
  };
};

const STABLECOINS = ["USDT", "USDC", "DAI", "USDT6", "USDT0", "USDT1", "USD"];

function isStablecoin(symbol: string) {
  return STABLECOINS.includes(symbol.toUpperCase());
}

function calculateAssetRiskScore(token0Symbol: string, token1Symbol: string) {
  const token0Stable = isStablecoin(token0Symbol);

  const token1Stable = isStablecoin(token1Symbol);

  // Stablecoin / stablecoin
  if (token0Stable && token1Stable) {
    return 95;
  }

  // One stablecoin + another asset
  if (token0Stable || token1Stable) {
    return 75;
  }

  // We don't yet have enough information
  // to confidently classify unknown assets.
  return 50;
}

export function calculateOpportunityScore(
  pool: PoolForScoring,
): OpportunityScore {
  /*
   * ----------------------------------------
   * 1. Yield
   * ----------------------------------------
   *
   * Use the sanity-adjusted yield score.
   *
   * This means a tiny pool with ridiculous APR
   * doesn't dominate the opportunity ranking.
   */

  const yieldScore = pool.yieldSanity.score;

  /*
   * ----------------------------------------
   * 2. Liquidity
   * ----------------------------------------
   */

  const liquidityScore = pool.yieldSanity.liquidityScore;

  /*
   * ----------------------------------------
   * 3. Trading activity
   * ----------------------------------------
   */

  const volumeTvlRatio = pool.tvl > 0 ? pool.volume24hUsd / pool.tvl : 0;

  let rawActivityScore = 0;

  if (volumeTvlRatio >= 1) {
    rawActivityScore = 100;
  } else if (volumeTvlRatio >= 0.5) {
    rawActivityScore = 80;
  } else if (volumeTvlRatio >= 0.1) {
    rawActivityScore = 60;
  } else if (volumeTvlRatio > 0) {
    rawActivityScore = 30;
  }

  // Activity from a microscopic pool should not
  // automatically be considered strong activity.
  const activityScore = rawActivityScore * (liquidityScore / 100);
  /*
   * ----------------------------------------
   * 4. Asset risk
   * ----------------------------------------
   */

  const assetRiskScore = calculateAssetRiskScore(
    pool.token0Symbol,
    pool.token1Symbol,
  );

  /*
   * ----------------------------------------
   * 5. Final opportunity score
   * ----------------------------------------
   */

  const score =
    yieldScore * 0.4 +
    liquidityScore * 0.25 +
    activityScore * 0.2 +
    assetRiskScore * 0.15;

  /*
   * ----------------------------------------
   * 6. Opportunity classification
   * ----------------------------------------
   */

  let level: OpportunityLevel;

  if (score >= 80) {
    level = "excellent";
  } else if (score >= 65) {
    level = "good";
  } else if (score >= 45) {
    level = "moderate";
  } else if (score >= 25) {
    level = "weak";
  } else {
    level = "high-risk";
  }

  /*
   * ----------------------------------------
   * 7. Explanation
   * ----------------------------------------
   */

  let explanation = "Limited opportunity based on current pool data.";

  if (level === "excellent") {
    explanation =
      "Strong yield, liquidity and trading activity relative to current pool conditions.";
  } else if (level === "good") {
    explanation =
      "Attractive yield with reasonably strong liquidity and trading activity.";
  } else if (level === "moderate") {
    explanation =
      "Potential opportunity, but one or more factors require caution.";
  } else if (level === "weak") {
    explanation =
      "Yield opportunity is limited or supported by weaker liquidity or activity.";
  } else if (level === "high-risk") {
    explanation =
      "High risk relative to the current yield and liquidity conditions.";
  }

  return {
    score: Math.min(100, Math.max(0, score)),

    level,

    yieldScore,

    liquidityScore,

    activityScore,

    assetRiskScore,

    explanation,
  };
}
