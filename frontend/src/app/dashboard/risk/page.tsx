"use client";

import { useBdexPools } from "@/hooks/useBdexPools";
import { usePortfolio } from "@/hooks/usePortfolio";
import { analyzePortfolio } from "@/lib/portfolioEngine";
import { calculatePortfolioRisk } from "@/lib/portfolioRiskEngine";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function RiskBar({
  label,
  score,
  note,
}: {
  label: string;
  score: number;
  note: string;
}) {
  const filledBars = Math.round(Math.max(0, Math.min(100, score)) / 10);

  return (
    <div className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3 text-sm">
      <span className="text-white/60">{label}</span>
      <div className="flex gap-1" aria-label={`${label}: ${score} out of 100`}>
        {Array.from({ length: 10 }, (_, index) => (
          <span
            key={index}
            className={`h-2 flex-1 rounded-sm ${index < filledBars ? "bg-[#00D4FF]" : "bg-white/10"}`}
          />
        ))}
      </div>
      <span className="font-mono text-xs text-white/45">{note}</span>
    </div>
  );
}

export default function RiskPage() {
  const {
    portfolio,
    isConnected,
    isLoading: portfolioLoading,
  } = usePortfolio();
  const portfolioAnalysis = portfolio
    ? analyzePortfolio(portfolio.assets, portfolio.totalValueUsd)
    : null;
  const portfolioRisk = portfolio
    ? calculatePortfolioRisk(portfolio.assets, portfolio.totalValueUsd)
    : null;
  const resolvedPortfolioRisk = portfolioRisk ?? {
    score: 0,
    level: "low" as const,
    reasons: [],
    warnings: [],
  };

  const { pools, isLoading: poolsLoading } = useBdexPools(
    portfolioAnalysis?.idleCapitalUsd ?? 0,
    resolvedPortfolioRisk,
  );

  if (!isConnected) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Connect your wallet</h1>
          <p className="mt-2 text-gray-500">
            Connect your wallet to analyse risk.
          </p>
        </div>
      </main>
    );
  }

  if (portfolioLoading || !portfolio || !portfolioAnalysis) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Analysing your portfolio...</p>
      </main>
    );
  }

  const largestAllocation = portfolioAnalysis.largestAsset?.allocation ?? 0;
  const nativeAllocation = portfolio.assets
    .filter((asset) => asset.type === "native")
    .reduce((total, asset) => total + asset.allocation, 0);

  // These levels mirror the thresholds used by calculatePortfolioRisk.
  const concentrationRisk =
    largestAllocation >= 80
      ? 100
      : largestAllocation >= 60
        ? 75
        : largestAllocation >= 40
          ? 50
          : 0;
  const volatilityRisk =
    nativeAllocation >= 70 ? 100 : nativeAllocation >= 40 ? 60 : 0;
  const liquidityRisk = 0;
  const protocolRisk = 0;
  // Sort pools by opportunity score (descending for best, ascending for worst)
  const topBestPools = [...pools]
    .sort(
      (a, b) =>
        (b.opportunity.score ?? b.yieldSanity.score) -
        (a.opportunity.score ?? a.yieldSanity.score),
    )
    .slice(0, 10);

  const topWorstPools = [...pools]
    .sort(
      (a, b) =>
        (a.opportunity.score ?? a.yieldSanity.score) -
        (b.opportunity.score ?? b.yieldSanity.score),
    )
    .slice(0, 5);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-10">
      <header className="mb-8">
        <p className="font-mono text-xs tracking-[0.18em] text-[#00D4FF]">
          RISKS
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Portfolio Risk</h1>
        <p className="mt-2 text-sm text-white/50">
          Exposure from wallet holdings and current BDEX pool conditions.
        </p>
      </header>

      <section className="rounded-xl border border-white/10 bg-white/[0.025] p-6">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
          <div>
            <p className="font-mono text-[11px] tracking-[0.12em] text-white/40">
              RISK SCORE
            </p>
            <p className="mt-3 text-5xl font-bold tracking-tight">
              {resolvedPortfolioRisk.score}
              <span className="ml-2 text-xl font-normal text-white/40">
                / 100
              </span>
            </p>
            <span className="mt-4 inline-flex rounded border border-amber-300/25 bg-amber-300/5 px-3 py-1 font-mono text-xs tracking-[0.12em] text-amber-300">
              {resolvedPortfolioRisk.level.toUpperCase()}
            </span>
          </div>
          <p className="max-w-sm text-sm leading-6 text-white/55">
            This score evaluates concentration, native-asset volatility, and
            diversification from the balances currently visible in your wallet.
          </p>
        </div>

        <div className="my-7 border-t border-white/10" />

        <div className="space-y-4">
          {resolvedPortfolioRisk.reasons.length > 0 ? (
            resolvedPortfolioRisk.reasons.map((reason) => (
              <div
                key={reason}
                className="flex gap-3 rounded-lg bg-white/[0.035] p-4"
              >
                <span className="text-amber-300">⚠</span>
                <div>
                  <p className="font-medium">Portfolio exposure</p>
                  <p className="mt-1 text-sm text-white/55">{reason}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex gap-3 rounded-lg bg-white/[0.035] p-4">
              <span className="text-emerald-400">✓</span>
              <div>
                <p className="font-medium">Concentration check</p>
                <p className="mt-1 text-sm text-white/55">
                  No concentration threshold has been triggered.
                </p>
              </div>
            </div>
          )}

          {portfolioAnalysis.idleCapitalUsd > 0 && (
            <div className="flex gap-3 rounded-lg bg-white/[0.035] p-4">
              <span className="text-amber-300">⚠</span>
              <div>
                <p className="font-medium">Idle Capital</p>
                <p className="mt-1 text-sm text-white/55">
                  {usd.format(portfolioAnalysis.idleCapitalUsd)} is currently
                  held as stablecoins in your wallet and earning 0% APY.
                </p>
              </div>
            </div>
          )}

          {resolvedPortfolioRisk.warnings.map((warning) => (
            <div
              key={warning}
              className="flex gap-3 rounded-lg bg-amber-300/[0.04] p-4"
            >
              <span className="text-amber-300">⚠</span>
              <div>
                <p className="font-medium">Risk warning</p>
                <p className="mt-1 text-sm text-white/55">{warning}</p>
              </div>
            </div>
          ))}

          <div className="flex gap-3 rounded-lg bg-white/[0.035] p-4">
            <span className="text-emerald-400">✓</span>
            <div>
              <p className="font-medium">Smart Contract Exposure</p>
              <p className="mt-1 text-sm text-white/55">
                No protocol positions are currently indexed. Contract exposure
                cannot be assessed until lending and LP positions are connected.
              </p>
            </div>
          </div>
        </div>

        <div className="my-7 border-t border-white/10" />

        <div>
          <h2 className="text-lg font-semibold">Risk Breakdown</h2>
          <p className="mt-1 text-sm text-white/50">
            Scores use the same thresholds as your portfolio risk calculation.
          </p>
          <div className="mt-6 space-y-4">
            <RiskBar
              label="Liquidity"
              score={liquidityRisk}
              note="Not assessed"
            />
            <RiskBar
              label="Concentration"
              score={concentrationRisk}
              note={`${largestAllocation.toFixed(0)}% largest`}
            />
            <RiskBar
              label="Volatility"
              score={volatilityRisk}
              note={`${nativeAllocation.toFixed(0)}% native`}
            />
            <RiskBar
              label="Protocol"
              score={protocolRisk}
              note="No positions"
            />
          </div>
        </div>
      </section>

      <section className="mt-8 space-y-10">
        {/* TOP 10 BEST OPPORTUNITY POOLS */}
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-emerald-400">
              Top 10 High Opportunity Pools
            </h2>
            <p className="mt-1 text-sm text-white/50">
              BDEX pools with the highest overall opportunity scores.
            </p>
          </div>

          {poolsLoading ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-6 text-sm text-white/50">
              Loading pool opportunities...
            </div>
          ) : topBestPools.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-6 text-sm text-white/50">
              No pools available.
            </div>
          ) : (
            <div className="space-y-4">
              {topBestPools.map((pool, idx) => (
                <article
                  key={pool.address}
                  className="rounded-xl border border-emerald-500/20 bg-white/[0.025] p-5"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-emerald-400">
                        #{idx + 1}
                      </span>
                      <div>
                        <h3 className="font-semibold">
                          {pool.token0Symbol} / {pool.token1Symbol}
                        </h3>
                        <p className="mt-1 text-sm text-white/50">
                          TVL {usd.format(pool.tvl)} · Fee APR{" "}
                          {pool.feeApr.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                    <span className="w-fit rounded border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 font-mono text-xs text-emerald-300">
                      Score:{" "}
                      {(
                        pool.opportunity.score ?? pool.yieldSanity.score
                      ).toFixed(1)}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-white/[0.04] p-3">
                      <p className="text-xs text-white/45">Yield Quality</p>
                      <p className="mt-1 font-mono text-sm">
                        {pool.yieldSanity.score.toFixed(1)} / 100
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/[0.04] p-3">
                      <p className="text-xs text-white/45">Liquidity Score</p>
                      <p className="mt-1 font-mono text-sm">
                        {pool.yieldSanity.liquidityScore.toFixed(0)} / 100
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/[0.04] p-3">
                      <p className="text-xs text-white/45">24h Volume</p>
                      <p className="mt-1 font-mono text-sm">
                        {usd.format(pool.volume24hUsd)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* TOP 5 WORST OPPORTUNITY POOLS */}
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-amber-400">
              Top 5 Lowest Opportunity Pools
            </h2>
            <p className="mt-1 text-sm text-white/50">
              Pools with the lowest ratings or yield warnings.
            </p>
          </div>

          {poolsLoading ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-6 text-sm text-white/50">
              Loading pool signals...
            </div>
          ) : topWorstPools.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-6 text-sm text-white/50">
              No low-score pools detected.
            </div>
          ) : (
            <div className="space-y-4">
              {topWorstPools.map((pool, idx) => (
                <article
                  key={pool.address}
                  className="rounded-xl border border-amber-500/20 bg-white/[0.025] p-5"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-amber-400">
                        #{idx + 1}
                      </span>
                      <div>
                        <h3 className="font-semibold">
                          {pool.token0Symbol} / {pool.token1Symbol}
                        </h3>
                        <p className="mt-1 text-sm text-white/50">
                          TVL {usd.format(pool.tvl)} · Fee APR{" "}
                          {pool.feeApr.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                    <span className="w-fit rounded border border-amber-300/25 bg-amber-300/5 px-2.5 py-1 font-mono text-xs text-amber-300">
                      Score:{" "}
                      {(
                        pool.opportunity.score ?? pool.yieldSanity.score
                      ).toFixed(1)}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-white/[0.04] p-3">
                      <p className="text-xs text-white/45">Yield Quality</p>
                      <p className="mt-1 font-mono text-sm">
                        {pool.yieldSanity.score.toFixed(1)} / 100
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/[0.04] p-3">
                      <p className="text-xs text-white/45">Liquidity Score</p>
                      <p className="mt-1 font-mono text-sm">
                        {pool.yieldSanity.liquidityScore.toFixed(0)} / 100
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/[0.04] p-3">
                      <p className="text-xs text-white/45">24h Volume</p>
                      <p className="mt-1 font-mono text-sm">
                        {usd.format(pool.volume24hUsd)}
                      </p>
                    </div>
                  </div>
                  {pool.yieldSanity.warning && (
                    <p className="mt-4 rounded-lg border border-amber-300/15 bg-amber-300/[0.04] p-3 text-sm text-amber-200">
                      ⚠ {pool.yieldSanity.warning}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
