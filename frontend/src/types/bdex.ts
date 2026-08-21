import type { Address } from "viem";

export type BdexPool = {
  address: Address;

  token0: Address;
  token1: Address;

  token0Symbol: string;
  token1Symbol: string;

  token0Name: string;
  token1Name: string;

  token0Decimals: number;
  token1Decimals: number;

  reserve0: bigint;
  reserve1: bigint;

  reserve0Formatted: string;
  reserve1Formatted: string;

  token0Price: number;
  token1Price: number;

  reserve0Value: number;
  reserve1Value: number;

  tvl: number;
};
