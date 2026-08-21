export type PersonalizedOpportunity = {
  suitable: boolean;

  action: "consider" | "watch" | "avoid";

  title: string;

  summary: string;

  suggestedCapitalUsd: number;

  reasons: string[];

  warnings: string[];
};

type Pool = {
  token0Symbol: string;
  token1Symbol: string;

  tvl: number;

  feeApr: number;

  volume24hUsd: number;

  opportunity: {
    score: number;
    liquidityScore: number;
  };

  recommendation: {
    action: "consider" | "watch" | "avoid";
  };
};

export function matchOpportunityToPortfolio(
  pool: Pool,
  idleCapitalUsd: number,
): PersonalizedOpportunity {
  /*
   * No idle capital
   */

  if (idleCapitalUsd <= 0) {
    return {
      suitable: false,

      action: "watch",

      title: "No idle capital detected",

      summary:
        "Your wallet does not currently have meaningful stablecoin capital available for deployment.",

      suggestedCapitalUsd: 0,

      reasons: ["No deployable stablecoin balance detected"],

      warnings: [],
    };
  }

  /*
   * Never recommend microscopic pools
   */

  if (pool.tvl < 100) {
    return {
      suitable: false,

      action: "avoid",

      title: "Avoid for your portfolio",

      summary:
        "This pool is too small to support a meaningful allocation from your wallet.",

      suggestedCapitalUsd: 0,

      reasons: [
        `Pool TVL is only $${pool.tvl.toFixed(2)}`,
        `Your available capital is $${idleCapitalUsd.toFixed(2)}`,
      ],

      warnings: [
        "Extremely low liquidity",
        "Large positions may experience significant price impact",
        "Reported APR may be misleading",
      ],
    };
  }

  /*
   * Don't allocate too much of a pool's TVL.
   *
   * We cap the suggested position at 5% of pool TVL.
   */

  const maxAllocationUsd = pool.tvl * 0.05;

  const suggestedCapitalUsd = Math.min(idleCapitalUsd * 0.25, maxAllocationUsd);

  /*
   * Weak opportunity
   */

  if (pool.recommendation.action === "avoid" || pool.opportunity.score < 40) {
    return {
      suitable: false,

      action: "avoid",

      title: "Not suitable right now",

      summary:
        "This pool does not currently provide a strong enough risk-adjusted opportunity for your portfolio.",

      suggestedCapitalUsd: 0,

      reasons: [
        `Opportunity score: ${pool.opportunity.score.toFixed(1)}/100`,
        `Pool TVL: $${pool.tvl.toLocaleString()}`,
      ],

      warnings: ["Risk/reward profile is currently weak"],
    };
  }

  /*
   * Strong opportunity
   */

  if (pool.opportunity.score >= 55 && pool.opportunity.liquidityScore >= 50) {
    return {
      suitable: true,

      action: "consider",

      title: "Consider a partial allocation",

      summary: `This pool currently appears suitable for a portion of your idle capital. A conservative allocation of approximately $${suggestedCapitalUsd.toFixed(2)} could be considered.`,

      suggestedCapitalUsd,

      reasons: [
        `Opportunity score: ${pool.opportunity.score.toFixed(1)}/100`,
        `Estimated fee APR: ${pool.feeApr.toFixed(2)}%`,
        `Pool TVL: $${pool.tvl.toLocaleString()}`,
        `You have approximately $${idleCapitalUsd.toLocaleString()} in potentially deployable capital`,
      ],

      warnings: [
        "Fee APR is based on recent activity",
        "Returns are not guaranteed",
        "Consider smart-contract and impermanent-loss risk",
      ],
    };
  }

  /*
   * Everything else
   */

  return {
    suitable: false,

    action: "watch",

    title: "Keep watching",

    summary:
      "This pool is interesting but does not currently provide a strong enough signal for a new allocation.",

    suggestedCapitalUsd: 0,

    reasons: [
      `Opportunity score: ${pool.opportunity.score.toFixed(1)}/100`,
      `Estimated fee APR: ${pool.feeApr.toFixed(2)}%`,
    ],

    warnings: ["Wait for stronger liquidity or opportunity signals"],
  };
}
