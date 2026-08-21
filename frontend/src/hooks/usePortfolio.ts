"use client";

import { useAccount, useBalance } from "wagmi";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import { usePrices } from "@/hooks/usePrices";
import { analyzePortfolioRisk } from "@/lib/riskEngine";

export function usePortfolio() {
  const { address, isConnected, isConnecting } = useAccount();

  const { data: botBalance, isLoading: botLoading } = useBalance({
    address,
  });

  const { balances: tokenBalances, isLoading: tokensLoading } =
    useTokenBalances();

  const { prices, isLoading: pricesLoading } = usePrices();

  if (!address) {
    return {
      portfolio: null,
      isConnected,
      isConnecting,
      isLoading: false,
    };
  }

  const botAmount = Number(botBalance?.formatted ?? 0);
  const botPrice = prices?.BOT ?? 0;
  const botValue = botAmount * botPrice;

  const assets = [
    {
      symbol: "BOT",
      name: "BOT",
      balance: botAmount,
      priceUsd: botPrice,
      valueUsd: botValue,
      type: "native" as const,
    },

    ...tokenBalances.map((token) => {
      const balance = Number(token.balance);

      let priceUsd: number;
      if (token.symbol === "WBOT") {
        priceUsd = prices?.WBOT ?? 0;
      } else if (token.symbol === "USDT") {
        priceUsd = prices?.USDT ?? 1; // fallback only if fetch failed
      } else {
        priceUsd = 0; // no price feed for this token yet
      }

      return {
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        balance,
        priceUsd,
        valueUsd: balance * priceUsd,
        type: "erc20" as const,
      };
    }),
  ];

  const totalValueUsd = assets.reduce(
    (total, asset) => total + asset.valueUsd,
    0,
  );

  const assetsWithAllocation = assets.map((asset) => ({
    ...asset,
    allocation: totalValueUsd > 0 ? (asset.valueUsd / totalValueUsd) * 100 : 0,
  }));

  const portfolio = {
    wallet: address,
    totalValueUsd,
    assets: assetsWithAllocation,
  };

  const risk = analyzePortfolioRisk(portfolio);

  return {
    portfolio,
    risk,
    isConnected,
    isConnecting,
    isLoading: botLoading || tokensLoading || pricesLoading,
  };
}
