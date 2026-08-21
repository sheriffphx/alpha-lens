"use client";

import Link from "next/link";
import OverviewStats from "@/components/dashboard/OverviewStats";
import { useBdexPools } from "@/hooks/useBdexPools";
import { usePortfolio } from "@/hooks/usePortfolio";
import { unlockEvents } from "@/lib/unlockData";
import { analyzePortfolio } from "@/lib/portfolioEngine";
import { calculatePortfolioRisk } from "@/lib/portfolioRiskEngine";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function Dashboard() {
  const { portfolio, isConnected, isConnecting, isLoading } = usePortfolio();
  const router = useRouter();

  useEffect(() => {
    if (!isConnecting && !isConnected) {
      router.push("/");
    }
  }, [isConnected, isConnecting, router]);

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

  const bestOpportunity = pools[0];
  const nextUnlock = unlockEvents
    .filter((unlock) => new Date(unlock.unlockDate).getTime() >= Date.now())
    .sort(
      (a, b) =>
        new Date(a.unlockDate).getTime() - new Date(b.unlockDate).getTime(),
    )[0];

  // Wallet balances are not yield-bearing positions. This becomes a weighted
  // APY once lending deposits and LP-token positions are indexed.
  const activeYieldApy = 0;

  if (isLoading || !portfolio || !portfolioAnalysis) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading portfolio...</p>
      </main>
    );
  }

  const analysisMessage =
    portfolioAnalysis.idleCapitalUsd > 0
      ? `You have ${usd.format(portfolioAnalysis.idleCapitalUsd)} in idle stablecoins. Review the best available opportunity before deploying capital.`
      : "Your wallet has no idle stablecoin capital detected. Review your risk and unlock exposure below.";

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-10">
      <header className="mb-6">
        <p className="font-mono text-xs tracking-[0.18em] text-[#00D4FF]">
          OVERVIEW
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Your DeFi dashboard</h1>
        <p className="mt-2 text-sm text-white/55">{portfolio.wallet}</p>
      </header>

      <section className="rounded-[10px] border border-[#00D4FF]/20 bg-[#00D4FF]/5 p-[18px] backdrop-blur-[16px]">
        <div className="flex flex-col justify-between gap-4 sm:flex-row">
          <div>
            <p className="font-mono text-[13px] tracking-[0.08em] text-[#00D4FF]">
              ALPHALENS ANALYSIS
            </p>
            <p className="mt-3 max-w-4xl text-[13px] leading-6 text-white/60">
              {analysisMessage}
            </p>
          </div>
          <Link
            href="/dashboard/copilot"
            className="h-fit shrink-0 rounded-md border border-[#00D4FF]/25 px-3 py-1.5 font-mono text-xs text-[#00D4FF] hover:bg-[#00D4FF]/15"
          >
            Ask Copilot
          </Link>
        </div>
      </section>

      <section className="mt-5 grid gap-[14px] md:grid-cols-3">
        <OverviewStats
          title="Total Portfolio"
          value={usd.format(portfolio.totalValueUsd)}
          description="Value across all wallet assets."
        />
        <OverviewStats
          title="Idle Capital"
          value={usd.format(portfolioAnalysis.idleCapitalUsd)}
          description="Stablecoins not earning yield."
        />
        <OverviewStats
          title="Active Yield"
          value={`${activeYieldApy.toFixed(2)}% APY`}
          description="No yield-bearing positions detected."
        />
      </section>

      <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Portfolio Performance</p>
            <p className="mt-1 text-sm text-white/50">
              Historical performance will appear after portfolio snapshots are
              collected.
            </p>
          </div>
          <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/50">
            30D
          </span>
        </div>
        <div className="mt-6 flex h-44 items-center justify-center border-b border-l border-dashed border-white/10 px-4">
          <p className="text-sm text-white/35">No historical data yet</p>
        </div>
        <div className="mt-2 flex justify-between text-xs text-white/35">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Portfolio Risk Summary</p>
              <p className="mt-1 text-sm capitalize text-white/50">
                {resolvedPortfolioRisk.level} risk ·{" "}
                {resolvedPortfolioRisk.score}/100
              </p>
            </div>
            <Link
              href="/dashboard/risk"
              className="text-sm text-[#00D4FF] hover:underline"
            >
              View risks
            </Link>
          </div>
          <div className="mt-5 rounded-xl bg-white/[0.04] p-4">
            <p className="text-2xl font-semibold capitalize">
              {resolvedPortfolioRisk.level}
            </p>
            <p className="mt-2 text-sm text-white/55">
              {resolvedPortfolioRisk.reasons[0] ??
                "No major portfolio risks detected from current wallet balances."}
            </p>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Best Opportunity</p>
              <p className="mt-1 text-sm text-white/50">
                Highest-ranked BDEX pool for your available capital.
              </p>
            </div>
            <Link
              href="/dashboard/copilot"
              className="text-sm text-[#00D4FF] hover:underline"
            >
              Explore
            </Link>
          </div>
          {poolsLoading ? (
            <p className="mt-8 text-sm text-white/50">Analyzing pools...</p>
          ) : bestOpportunity ? (
            <div className="mt-5 rounded-xl bg-white/[0.04] p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">
                  {bestOpportunity.token0Symbol} /{" "}
                  {bestOpportunity.token1Symbol}
                </p>
                <p className="font-mono text-sm text-[#00D4FF]">
                  {bestOpportunity.feeApr.toFixed(2)}% APR
                </p>
              </div>
              <p className="mt-2 text-sm text-white/55">
                Opportunity score:{" "}
                {bestOpportunity.opportunity.score.toFixed(1)}/100 ·{" "}
                {bestOpportunity.opportunity.explanation}
              </p>
            </div>
          ) : (
            <p className="mt-8 text-sm text-white/50">
              No pool opportunities are available yet.
            </p>
          )}
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">AlphaLens Agent</p>
              <p className="mt-1 text-sm text-white/50">
                Configure, run, and monitor your autonomous trading agent.
              </p>
            </div>
            <Link
              href="/dashboard/agent"
              className="text-sm text-[#00D4FF] hover:underline"
            >
              Open Agent
            </Link>
          </div>
          <div className="mt-5 rounded-xl bg-[#00D4FF]/5 p-4">
            <p className="text-sm leading-6 text-white/60">
              Set an agent policy and let AlphaLens execute swaps on your behalf
              within your defined limits.
            </p>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Copilot Insight</p>
              <p className="mt-1 text-sm text-white/50">
                A tailored next step from AlphaLens.
              </p>
            </div>
            <Link
              href="/dashboard/copilot"
              className="text-sm text-[#00D4FF] hover:underline"
            >
              Open Copilot
            </Link>
          </div>
          <div className="mt-5 rounded-xl bg-[#00D4FF]/5 p-4">
            <p className="font-medium">
              {bestOpportunity?.copilot?.title ??
                "Your portfolio is ready for analysis"}
            </p>
            <p className="mt-2 text-sm leading-6 text-white/60">
              {bestOpportunity?.copilot?.summary ??
                "Ask Copilot for a risk-aware review of your wallet and currently available liquidity opportunities."}
            </p>
          </div>
        </article>
      </section>
    </main>
  );
}
