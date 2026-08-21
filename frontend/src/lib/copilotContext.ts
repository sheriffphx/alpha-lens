import type { UnlockEvent } from "@/lib/unlockData";

type PortfolioAsset = {
  symbol: string;
  type: "native" | "erc20";
  balance: number;
  priceUsd: number;
  valueUsd: number;
  allocation: number;
};

type PortfolioRisk = {
  score: number;
  level: string;
  reasons: string[];
  warnings: string[];
};

type Pool = {
  token0Symbol: string;
  token1Symbol: string;

  tvl: number;

  feeApr: number;

  volume24hUsd: number;

  fees24hUsd: number;

  swapCount24h: number;

  opportunity: {
    score: number;
    liquidityScore: number;
    activityScore: number;
    assetRiskScore: number;
  };

  yieldSanity: {
    score: number;
    level: string;
    warning: string | null;
  };

  personalized: {
    suggestedCapitalUsd: number;
  };

  copilot: {
    action: string;
    title: string;
    summary: string;
    suggestedCapitalUsd: number;
    reasons: string[];
    risks: string[];
  };
};

type PortfolioContextInput = {
  wallet: string;

  totalValueUsd: number;

  assets: PortfolioAsset[];

  idleCapitalUsd: number;

  portfolioRisk: PortfolioRisk;

  pools: Pool[];

  unlocks: UnlockEvent[];
};

export function buildCopilotContext(data: PortfolioContextInput) {
  return {
    wallet: data.wallet,

    portfolio: {
      totalValueUsd: data.totalValueUsd,

      idleCapitalUsd: data.idleCapitalUsd,

      assets: data.assets.map((asset) => ({
        symbol: asset.symbol,
        type: asset.type,
        balance: asset.balance,
        priceUsd: asset.priceUsd,
        valueUsd: asset.valueUsd,
        allocation: asset.allocation,
      })),

      risk: {
        score: data.portfolioRisk.score,

        level: data.portfolioRisk.level,

        reasons: data.portfolioRisk.reasons,

        warnings: data.portfolioRisk.warnings,
      },
    },

    opportunities: data.pools.map((pool) => ({
      pair: `${pool.token0Symbol} / ${pool.token1Symbol}`,

      tvl: pool.tvl,

      feeApr: pool.feeApr,

      volume24hUsd: pool.volume24hUsd,

      fees24hUsd: pool.fees24hUsd,

      swapCount24h: pool.swapCount24h,

      opportunityScore: pool.opportunity.score,

      liquidityScore: pool.opportunity.liquidityScore,

      activityScore: pool.opportunity.activityScore,

      assetScore: pool.opportunity.assetRiskScore,

      yieldSanity: {
        score: pool.yieldSanity.score,

        level: pool.yieldSanity.level,

        warning: pool.yieldSanity.warning,
      },

      suggestedCapitalUsd: pool.personalized.suggestedCapitalUsd,

      copilot: {
        action: pool.copilot.action,

        title: pool.copilot.title,

        summary: pool.copilot.summary,

        suggestedCapitalUsd: pool.copilot.suggestedCapitalUsd,

        reasons: pool.copilot.reasons,

        risks: pool.copilot.risks,
      },
    })),

    unlocks: (data.unlocks ?? []).map((unlock) => ({
      token: unlock.token,
      type: unlock.type,
      amountUsd: unlock.amountUsd,
      unlockDate: unlock.unlockDate,
      description: unlock.description,
      risk: unlock.risk,
    })),
  };
}
