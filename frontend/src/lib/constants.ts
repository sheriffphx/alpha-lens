export const MAINNET_CHAIN_ID = 677;
export const TESTNET_CHAIN_ID = 968;

export const NETWORK_CONFIG = {
  [MAINNET_CHAIN_ID]: {
    name: "Mainnet",
    executor: "0xB363a61f16Ca0a69772A9a445c707D5C98590F92",
    router: "0x1414eD29FdFD322c3c0a830330ed982E2D629e76",
  },
  [TESTNET_CHAIN_ID]: {
    name: "Testnet",
    executor: "0xF5B91F7D5a3863C244Ba4Cb9b409da9f88654DF1",
    router: "0xD6425a02f0845B8D99e349C34D2E7A576E177345",
  },
};
