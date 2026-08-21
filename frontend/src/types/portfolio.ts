import type { Address } from "viem";

export type PortfolioAsset = {
  address?: Address;
  symbol: string;
  name: string;
  balance: number;
  priceUsd: number;
  valueUsd: number;
  allocation: number;
  type: "native" | "erc20";
};

export type Portfolio = {
  wallet: Address;
  totalValueUsd: number;
  assets: PortfolioAsset[];
};
