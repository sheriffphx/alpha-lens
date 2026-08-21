"use client";

import { useEffect, useState } from "react";

type Prices = {
  BOT: number | null;
  WBOT: number | null;
  USDT: number;
};

export function usePrices() {
  const [prices, setPrices] = useState<Prices | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const response = await fetch("/api/prices");

        if (!response.ok) {
          throw new Error("Failed to fetch prices");
        }

        const data = await response.json();

        setPrices({
          BOT: data.BOT,
          WBOT: data.WBOT,
          USDT: 1,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPrices();
  }, []);

  return {
    prices,
    isLoading,
  };
}
