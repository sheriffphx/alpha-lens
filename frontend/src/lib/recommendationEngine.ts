export type RecommendationAction = "consider" | "watch" | "avoid";

export type Recommendation = {
  action: RecommendationAction;

  title: string;

  summary: string;

  reasons: string[];

  risks: string[];
};

type PoolForRecommendation = {
  tvl: number;

  feeApr: number;

  volume24hUsd: number;

  opportunity: {
    score: number;
    level: string;

    yieldScore: number;

    liquidityScore: number;

    activityScore: number;

    assetRiskScore: number;
  };

  yieldSanity: {
    score: number;

    liquidityScore: number;

    warning?: string | null;
  };

  token0Symbol: string;

  token1Symbol: string;
};

export function generateRecommendation(
  pool: PoolForRecommendation,
): Recommendation {
  const { opportunity, yieldSanity } = pool;

  /*
   * ----------------------------------------
   * HARD AVOID CONDITIONS
   * ----------------------------------------
   */

  if (pool.tvl < 100 && pool.feeApr > 100) {
    return {
      action: "avoid",

      title: "Avoid chasing this yield",

      summary:
        "The reported APR is extremely high, but the pool has very low liquidity. The yield is unlikely to be reliable at meaningful capital sizes.",

      reasons: [
        `Only $${pool.tvl.toFixed(2)} TVL`,
        `${pool.feeApr.toFixed(2)}% estimated fee APR`,
        "Very low liquidity makes the annualized yield unreliable",
      ],

      risks: [
        "High liquidity risk",
        "Large price impact",
        "APR may fall rapidly",
        "Difficult to deploy meaningful capital",
      ],
    };
  }

  /*
   * ----------------------------------------
   * VERY LOW LIQUIDITY
   * ----------------------------------------
   */

  if (opportunity.liquidityScore <= 10) {
    return {
      action: "avoid",

      title: "Avoid",

      summary:
        "The pool does not currently have enough liquidity to support a strong investment case.",

      reasons: [
        `TVL is only $${pool.tvl.toFixed(2)}`,
        "Liquidity score is extremely low",
      ],

      risks: [
        "High price impact",
        "Exit liquidity risk",
        "Yield may not be sustainable",
      ],
    };
  }

  /*
   * ----------------------------------------
   * STRONG OPPORTUNITY
   * ----------------------------------------
   */

  if (
    opportunity.score >= 70 &&
    opportunity.liquidityScore >= 60 &&
    yieldSanity.score >= 50
  ) {
    return {
      action: "consider",

      title: "Consider this pool",

      summary:
        "This pool currently combines attractive yield with reasonably strong liquidity and activity.",

      reasons: [
        `Opportunity score: ${opportunity.score.toFixed(1)}/100`,
        `Estimated fee APR: ${pool.feeApr.toFixed(2)}%`,
        `TVL: $${pool.tvl.toLocaleString("en-US", {
          maximumFractionDigits: 0,
        })}`,
      ],

      risks: [
        "Fee APR is based on recent activity",
        "Past activity does not guarantee future returns",
        "Smart-contract and impermanent-loss risks still apply",
      ],
    };
  }

  /*
   * ----------------------------------------
   * GOOD BUT NOT EXCELLENT
   * ----------------------------------------
   */

  if (opportunity.score >= 50 && opportunity.liquidityScore >= 40) {
    return {
      action: "consider",

      title: "Potential opportunity",

      summary:
        "The pool has a reasonable risk/reward profile, but some factors require caution.",

      reasons: [
        `Opportunity score: ${opportunity.score.toFixed(1)}/100`,
        `Estimated fee APR: ${pool.feeApr.toFixed(2)}%`,
        `TVL: $${pool.tvl.toLocaleString("en-US", {
          maximumFractionDigits: 0,
        })}`,
      ],

      risks: [
        "Yield may change as trading activity changes",
        "Liquidity should be monitored",
        "Consider position size carefully",
      ],
    };
  }

  /*
   * ----------------------------------------
   * EVERYTHING ELSE
   * ----------------------------------------
   */

  return {
    action: "watch",

    title: "Watch",

    summary:
      "The pool may become interesting if liquidity, trading activity or yield improves.",

    reasons: [
      `Opportunity score: ${opportunity.score.toFixed(1)}/100`,
      `Estimated fee APR: ${pool.feeApr.toFixed(2)}%`,
    ],

    risks: [
      "Current opportunity is not strong enough",
      "Monitor liquidity and trading activity",
    ],
  };
}
