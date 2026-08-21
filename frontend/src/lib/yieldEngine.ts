export type YieldSanity = {
  liquidityScore: number;
  yieldScore: number;
  score: number;
  level: "strong" | "moderate" | "weak" | "high-risk";
  warning: string | null;
};

export function calculateYieldSanity(pool: {
  tvl: number;
  feeApr: number;
  volume24hUsd: number;
}): YieldSanity {
  const { tvl, feeApr, volume24hUsd } = pool;

  // ----------------------------------------
  // 1. Liquidity confidence
  // ----------------------------------------

  let liquidityScore = 0;

  if (tvl >= 1_000_000) {
    liquidityScore = 100;
  } else if (tvl >= 100_000) {
    liquidityScore = 85;
  } else if (tvl >= 10_000) {
    liquidityScore = 70;
  } else if (tvl >= 1_000) {
    liquidityScore = 50;
  } else if (tvl >= 100) {
    liquidityScore = 25;
  } else {
    liquidityScore = 5;
  }

  // ----------------------------------------
  // 2. Yield score
  //
  // Cap APR influence at 50%.
  // This prevents ridiculous APRs from tiny
  // pools dominating the ranking.
  // ----------------------------------------

  const cappedApr = Math.min(feeApr, 50);

  const yieldScore = (cappedApr / 50) * 100;

  // ----------------------------------------
  // 3. Volume / TVL activity
  // ----------------------------------------

  const volumeTvlRatio = tvl > 0 ? volume24hUsd / tvl : 0;

  let activityScore = 0;

  if (volumeTvlRatio >= 1) {
    activityScore = 100;
  } else if (volumeTvlRatio >= 0.5) {
    activityScore = 80;
  } else if (volumeTvlRatio >= 0.1) {
    activityScore = 60;
  } else if (volumeTvlRatio > 0) {
    activityScore = 30;
  }

  // ----------------------------------------
  // 4. Overall score
  // ----------------------------------------

  const baseScore =
    yieldScore * 0.5 + liquidityScore * 0.3 + activityScore * 0.2;

  // Liquidity acts as a confidence multiplier.
  // Very small pools should not be able to dominate
  // the ranking just because their annualized APR is high.
  const liquidityMultiplier = liquidityScore / 100;

  const score = baseScore * liquidityMultiplier;

  // ----------------------------------------
  // 5. Risk classification
  // ----------------------------------------

  let level: YieldSanity["level"] = "weak";

  if (tvl < 100) {
    level = "high-risk";
  } else if (score >= 70) {
    level = "strong";
  } else if (score >= 40) {
    level = "moderate";
  }

  // ----------------------------------------
  // 6. Warning
  // ----------------------------------------

  let warning: string | null = null;

  if (tvl < 100) {
    warning = "Extremely low liquidity. High APR may be misleading.";
  } else if (tvl < 1_000) {
    warning = "Very low liquidity. Consider price impact and exit risk.";
  } else if (feeApr > 100) {
    warning =
      "Very high annualized yield. Current activity may not be sustainable.";
  }

  return {
    liquidityScore,
    yieldScore,
    score,
    level,
    warning,
  };
}
