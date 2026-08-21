import type { Address } from "viem";

const BOT_TESTNET_CHAIN_ID = 968;
const BOT_MAINNET_CHAIN_ID = 677;

const TESTNET_EXECUTOR: Address =
  "0xF5B91F7D5a3863C244Ba4Cb9b409da9f88654DF1";

const MAINNET_EXECUTOR: Address =
  "0xB363a61f16Ca0a69772A9a445c707D5C98590F92";

export function getAlphaLensExecutor(
  chainId: number,
): Address {
  if (chainId === BOT_TESTNET_CHAIN_ID) {
    return TESTNET_EXECUTOR;
  }

  if (chainId === BOT_MAINNET_CHAIN_ID) {
    return MAINNET_EXECUTOR;
  }

  throw new Error(
    `Unsupported chain: ${chainId}`,
  );
}