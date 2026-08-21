export type CopilotAction = "consider" | "watch" | "avoid";

export type CopilotRecommendation = {
  action: CopilotAction;

  title: string;

  summary: string;

  suggestedCapitalUsd: number;

  reasons: string[];

  risks: string[];
};

type PortfolioRisk = {
  score: number;

  level: "low" | "moderate" | "high" | "critical";
};

type Pool = {
  token0Symbol: string;
  token1Symbol: string;

  tvl: number;
  feeApr: number;

  opportunity: {
    score: number;
    liquidityScore: number;
  };

  recommendation: {
    action: "consider" | "watch" | "avoid";
  };

  personalized: {
    suggestedCapitalUsd: number;
  };
};

export function generateCopilotRecommendation(
  pool: Pool,
  portfolioRisk: PortfolioRisk,
): CopilotRecommendation {
  const pair = `${pool.token0Symbol} / ${pool.token1Symbol}`;

  /*
   * ---------------------------------------
   * 1. Never recommend dangerous pools
   * ---------------------------------------
   */

  if (
    pool.recommendation.action === "avoid" ||
    pool.tvl < 100 ||
    pool.opportunity.liquidityScore < 10
  ) {
    return {
      action: "avoid",

      title: `Avoid ${pair}`,

      summary:
        "This opportunity does not currently have enough liquidity or risk-adjusted quality to justify allocating portfolio capital.",

      suggestedCapitalUsd: 0,

      reasons: [
        `Pool TVL: $${pool.tvl.toFixed(2)}`,
        `Opportunity score: ${pool.opportunity.score.toFixed(1)}/100`,
        `Liquidity score: ${pool.opportunity.liquidityScore}/100`,
      ],

      risks: [
        "Very low liquidity",
        "Potentially large price impact",
        "Yield may not be sustainable",
      ],
    };
  }

  /*
   * ---------------------------------------
   * 2. High portfolio risk
   *
   * Don't aggressively deploy more capital
   * when the user's portfolio is already risky.
   * ---------------------------------------
   */

  if (portfolioRisk.level === "critical" || portfolioRisk.level === "high") {
    return {
      action: "watch",

      title: `Watch ${pair} before allocating`,

      summary:
        "The pool itself may be interesting, but your current portfolio already carries elevated risk. Preserving flexibility may be preferable to increasing exposure.",

      suggestedCapitalUsd: 0,

      reasons: [
        `Portfolio risk: ${portfolioRisk.level}`,
        `Portfolio risk score: ${portfolioRisk.score}/100`,
        `Pool opportunity score: ${pool.opportunity.score.toFixed(1)}/100`,
      ],

      risks: [
        "Increasing exposure could amplify portfolio risk",
        "Consider reducing concentration before adding another position",
      ],
    };
  }

  /*
   * ---------------------------------------
   * 3. Strong opportunity
   * ---------------------------------------
   */

  if (
    pool.opportunity.score >= 55 &&
    pool.opportunity.liquidityScore >= 50 &&
    pool.personalized.suggestedCapitalUsd > 0
  ) {
    return {
      action: "consider",

      title: `Consider ${pair}`,

      summary: `This pool currently offers one of the stronger risk-adjusted opportunities available to your portfolio. A partial allocation of approximately $${pool.personalized.suggestedCapitalUsd.toFixed(2)} could be considered.`,

      suggestedCapitalUsd: pool.personalized.suggestedCapitalUsd,

      reasons: [
        `Opportunity score: ${pool.opportunity.score.toFixed(1)}/100`,
        `Estimated fee APR: ${pool.feeApr.toFixed(2)}%`,
        `Pool TVL: $${pool.tvl.toLocaleString()}`,
        `Portfolio risk: ${portfolioRisk.level}`,
      ],

      risks: [
        "Fee APR is based on recent activity",
        "Returns are not guaranteed",
        "Smart-contract and impermanent-loss risks remain",
      ],
    };
  }

  /*
   * ---------------------------------------
   * 4. Everything else
   * ---------------------------------------
   */

  return {
    action: "watch",

    title: `Watch ${pair}`,

    summary:
      "The pool is not currently strong enough to justify a new allocation.",

    suggestedCapitalUsd: 0,

    reasons: [
      `Opportunity score: ${pool.opportunity.score.toFixed(1)}/100`,
      `Estimated fee APR: ${pool.feeApr.toFixed(2)}%`,
    ],

    risks: [
      "Opportunity may improve or deteriorate as market activity changes",
    ],
  };
}
