export type PortfolioAsset = {
  symbol: string;
  balance: number;
  priceUsd: number;
  valueUsd: number;
  allocation: number;
  type: "native" | "erc20";
};

export type PortfolioAnalysis = {
  totalValueUsd: number;

  stablecoinValueUsd: number;

  stablecoinAllocation: number;

  largestAsset: {
    symbol: string;
    allocation: number;
  } | null;

  idleCapitalUsd: number;
};

const STABLECOINS = ["USDT", "USDC", "DAI"];

export function analyzePortfolio(
  assets: PortfolioAsset[],
  totalValueUsd: number,
): PortfolioAnalysis {
  /*
   * --------------------------------
   * Stablecoins
   * --------------------------------
   */

  const stablecoinAssets = assets.filter((asset) =>
    STABLECOINS.includes(asset.symbol.toUpperCase()),
  );

  const stablecoinValueUsd = stablecoinAssets.reduce(
    (total, asset) => total + asset.valueUsd,
    0,
  );

  const stablecoinAllocation =
    totalValueUsd > 0 ? (stablecoinValueUsd / totalValueUsd) * 100 : 0;

  /*
   * --------------------------------
   * Largest asset
   * --------------------------------
   */

  const largestAsset =
    assets.length > 0
      ? [...assets].sort((a, b) => b.allocation - a.allocation)[0]
      : null;

  /*
   * --------------------------------
   * Idle capital
   *
   * For now we treat stablecoins
   * as potentially deployable capital.
   * --------------------------------
   */

  const idleCapitalUsd = stablecoinValueUsd;

  return {
    totalValueUsd,

    stablecoinValueUsd,

    stablecoinAllocation,

    largestAsset: largestAsset
      ? {
          symbol: largestAsset.symbol,
          allocation: largestAsset.allocation,
        }
      : null,

    idleCapitalUsd,
  };
}
