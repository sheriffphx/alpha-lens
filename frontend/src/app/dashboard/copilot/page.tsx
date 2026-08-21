"use client";

import { Copilot } from "@/components/dashboard/Copilot";
import { useBdexPools } from "@/hooks/useBdexPools";
import { usePortfolio } from "@/hooks/usePortfolio";
import { buildCopilotContext } from "@/lib/copilotContext";
import { unlockEvents } from "@/lib/unlockData";
import { analyzePortfolio } from "@/lib/portfolioEngine";
import { calculatePortfolioRisk } from "@/lib/portfolioRiskEngine";

export default function CopilotPage() {
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

  const copilotContext =
    portfolio && portfolioAnalysis
      ? buildCopilotContext({
          wallet: portfolio.wallet,
          totalValueUsd: portfolio.totalValueUsd,
          assets: portfolio.assets,
          idleCapitalUsd: portfolioAnalysis.idleCapitalUsd,
          portfolioRisk: resolvedPortfolioRisk,
          pools,
          unlocks: unlockEvents,
        })
      : null;

  if (!isConnected) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md text-center">
          <p className="font-mono text-xs tracking-[0.18em] text-[#00D4FF]">
            ALPHALENS COPILOT
          </p>
          <h1 className="mt-3 text-3xl font-semibold">
            Connect your wallet to start a session
          </h1>
          <p className="mt-3 text-sm leading-6 text-white/50">
            Copilot uses your connected wallet and current protocol data to
            answer portfolio questions.
          </p>
        </div>
      </main>
    );
  }

  if (portfolioLoading || poolsLoading || !copilotContext) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-white/50">
          Preparing your Copilot session...
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <header className="mb-7">
        <p className="font-mono text-xs tracking-[0.18em] text-[#00D4FF]">
          ALPHALENS COPILOT
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          Portfolio intelligence, in context
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
          Ask clear questions about your wallet, risk exposure, current pool
          opportunities, or unlock events. Copilot bases its answers on the
          dashboard data available for this session.
        </p>
      </header>

      <Copilot context={copilotContext} />
    </main>
  );
}
