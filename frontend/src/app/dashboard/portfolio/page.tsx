"use client";

import { usePortfolio } from "@/hooks/usePortfolio";
import { analyzePortfolio } from "@/lib/portfolioEngine";

const STABLECOINS = new Set(["USDT", "USDC", "DAI"]);

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function StatCard({
  label,
  value,
  detail,
  detailClassName = "text-white/45",
}: {
  label: string;
  value: string;
  detail: string;
  detailClassName?: string;
}) {
  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.025] p-6">
      <p className="font-mono text-[11px] tracking-[0.12em] text-white/40">
        {label}
      </p>
      <p className="mt-4 text-3xl font-bold tracking-tight text-white">{value}</p>
      <p className={`mt-2 text-sm ${detailClassName}`}>{detail}</p>
    </article>
  );
}

export default function PortfolioPage() {
  const { portfolio, isConnected, isLoading } = usePortfolio();
  const portfolioAnalysis = portfolio
    ? analyzePortfolio(portfolio.assets, portfolio.totalValueUsd)
    : null;

  if (!isConnected) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Connect your wallet</h1>
          <p className="mt-2 text-gray-500">
            Connect your wallet to view your portfolio.
          </p>
        </div>
      </main>
    );
  }

  if (isLoading || !portfolio || !portfolioAnalysis) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading portfolio...</p>
      </main>
    );
  }

  const assets = [...portfolio.assets].sort((a, b) => b.valueUsd - a.valueUsd);
  const composition = portfolio.assets.reduce(
    (totals, asset) => {
      if (STABLECOINS.has(asset.symbol.toUpperCase())) {
        totals.stablecoins += asset.valueUsd;
      } else if (asset.type === "native") {
        totals.native += asset.valueUsd;
      } else {
        totals.other += asset.valueUsd;
      }

      return totals;
    },
    { stablecoins: 0, native: 0, other: 0 },
  );

  const totalValue = portfolio.totalValueUsd;
  const stablecoinPercent = totalValue > 0 ? (composition.stablecoins / totalValue) * 100 : 0;
  const nativePercent = totalValue > 0 ? (composition.native / totalValue) * 100 : 0;
  const otherPercent = Math.max(0, 100 - stablecoinPercent - nativePercent);
  const nativeEnd = stablecoinPercent + nativePercent;
  const compositionGradient =
    totalValue > 0
      ? `conic-gradient(#00D4FF 0% ${stablecoinPercent}%, #8B5CF6 ${stablecoinPercent}% ${nativeEnd}%, #F59E0B ${nativeEnd}% 100%)`
      : "conic-gradient(#ffffff12 0% 100%)";

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-10">
      <header className="mb-8">
        <p className="font-mono text-xs tracking-[0.18em] text-[#00D4FF]">PORTFOLIO</p>
        <h1 className="mt-2 text-3xl font-semibold">Portfolio Value</h1>
        <p className="mt-2 text-sm text-white/50">{portfolio.wallet}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="TOTAL VALUE"
          value={usd.format(totalValue)}
          detail={`${assets.length} wallet ${assets.length === 1 ? "asset" : "assets"}`}
        />
        <StatCard
          label="EARNING YIELD"
          value={usd.format(0)}
          detail="No active positions"
          detailClassName="text-[#00D4FF]"
        />
        <StatCard
          label="IDLE ASSETS"
          value={usd.format(portfolioAnalysis.idleCapitalUsd)}
          detail={`${portfolioAnalysis.stablecoinAllocation.toFixed(1)}% of portfolio`}
          detailClassName="text-rose-400"
        />
        <StatCard
          label="LARGEST ASSET"
          value={portfolioAnalysis.largestAsset?.symbol ?? "—"}
          detail={
            portfolioAnalysis.largestAsset
              ? `${portfolioAnalysis.largestAsset.allocation.toFixed(1)}% allocation`
              : "No assets detected"
          }
          detailClassName="text-[#00D4FF]"
        />
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-2">
        <article className="rounded-xl border border-white/10 bg-white/[0.025] p-6">
          <div>
            <h2 className="text-lg font-semibold">Portfolio Composition</h2>
            <p className="mt-1 text-sm text-white/50">Allocation by asset category</p>
          </div>
          <div className="mt-6 flex flex-col items-center gap-8 sm:flex-row sm:justify-center">
            <div
              aria-label="Portfolio allocation donut chart"
              className="relative h-44 w-44 shrink-0 rounded-full"
              style={{ background: compositionGradient }}
            >
              <div className="absolute inset-6 flex flex-col items-center justify-center rounded-full bg-[#02060b]">
                <span className="text-xs text-white/45">Total</span>
                <span className="mt-1 text-sm font-semibold">{usd.format(totalValue)}</span>
              </div>
            </div>
            <div className="w-full space-y-4">
              {[
                { label: "Stablecoins", value: composition.stablecoins, percent: stablecoinPercent, color: "bg-[#00D4FF]" },
                { label: "Native", value: composition.native, percent: nativePercent, color: "bg-[#8B5CF6]" },
                { label: "Other", value: composition.other, percent: otherPercent, color: "bg-[#F59E0B]" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4 text-sm">
                  <div className="flex items-center gap-2 text-white/65">
                    <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                    {item.label}
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-white">{item.percent.toFixed(1)}%</span>
                    <span className="ml-2 text-white/40">{usd.format(item.value)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-white/10 bg-white/[0.025] p-6">
          <h2 className="text-lg font-semibold">Portfolio Analysis</h2>
          <p className="mt-1 text-sm text-white/50">A quick read on capital allocation</p>
          <dl className="mt-6 divide-y divide-white/10">
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="text-sm text-white/50">Stablecoin value</dt>
              <dd className="font-mono text-sm font-medium">{usd.format(portfolioAnalysis.stablecoinValueUsd)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="text-sm text-white/50">Stablecoin allocation</dt>
              <dd className="font-mono text-sm font-medium">{portfolioAnalysis.stablecoinAllocation.toFixed(2)}%</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="text-sm text-white/50">Idle capital</dt>
              <dd className="font-mono text-sm font-medium text-rose-400">{usd.format(portfolioAnalysis.idleCapitalUsd)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="text-sm text-white/50">Largest asset</dt>
              <dd className="font-mono text-sm font-medium">
                {portfolioAnalysis.largestAsset
                  ? `${portfolioAnalysis.largestAsset.symbol} (${portfolioAnalysis.largestAsset.allocation.toFixed(2)}%)`
                  : "—"}
              </dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Assets</h2>
          <p className="mt-1 text-sm text-white/50">Assets currently held in your connected wallet.</p>
        </div>
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.025]">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[1.8fr_1fr_1fr_1fr_1fr_1.1fr_0.8fr] gap-4 border-b border-white/10 px-5 py-4 font-mono text-[11px] tracking-[0.1em] text-white/40">
              <div>ASSET</div>
              <div>PROTOCOL</div>
              <div>BALANCE</div>
              <div>PRICE</div>
              <div>ALLOCATION</div>
              <div>VALUE</div>
              <div>STATUS</div>
            </div>
            {assets.map((asset) => {
              const isIdle = STABLECOINS.has(asset.symbol.toUpperCase());

              return (
                <div
                  key={`${asset.type}-${asset.symbol}`}
                  className="grid grid-cols-[1.8fr_1fr_1fr_1fr_1fr_1.1fr_0.8fr] items-center gap-4 border-b border-white/[0.07] px-5 py-4 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/[0.07] font-mono text-[10px] text-white/75">
                      {asset.symbol.slice(0, 4)}
                    </span>
                    <div>
                      <p className="font-semibold">{asset.symbol}</p>
                      <p className="mt-0.5 text-xs text-white/40">{asset.name}</p>
                    </div>
                  </div>
                  <div className="text-sm text-white/55">Wallet</div>
                  <div className="font-mono text-sm">{asset.balance.toLocaleString("en-US", { maximumFractionDigits: 6 })}</div>
                  <div className="font-mono text-sm text-white/55">{usd.format(asset.priceUsd)}</div>
                  <div className="font-mono text-sm text-white/70">{asset.allocation.toFixed(2)}%</div>
                  <div className="font-mono text-sm font-semibold">{usd.format(asset.valueUsd)}</div>
                  <div>
                    <span className={`rounded border px-2 py-1 font-mono text-[10px] tracking-wide ${isIdle ? "border-rose-400/25 bg-rose-400/5 text-rose-400" : "border-[#00D4FF]/25 bg-[#00D4FF]/5 text-[#00D4FF]"}`}>
                      {isIdle ? "IDLE" : "HELD"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-white/10 bg-white/[0.025] p-6">
        <h2 className="text-lg font-semibold">Active Yield Positions</h2>
        <p className="mt-1 text-sm text-white/50">Deposits and LP positions that are actively generating yield.</p>
        <div className="mt-5 rounded-lg border border-dashed border-white/10 p-6 text-sm text-white/45">
          No yield-bearing positions are indexed yet. Once lending deposits and LP-token balances are connected, their APY and earned yield will appear here.
        </div>
      </section>
    </main>
  );
}
