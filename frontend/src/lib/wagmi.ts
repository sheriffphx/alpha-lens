import { defineChain, http } from "viem";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig } from "wagmi";

// BOT Chain Mainnet
export const botChain = defineChain({
  id: 677,
  name: "BOT Chain",
  nativeCurrency: {
    name: "BOT",
    symbol: "BOT",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.botchain.ai"],
    },
  },
  blockExplorers: {
    default: {
      name: "BOT Chain Explorer",
      url: "https://scan.botchain.ai",
    },
  },
});

// BOT Chain Testnet
export const botChainTestnet = defineChain({
  id: 968,
  name: "BOT Chain Testnet",
  nativeCurrency: {
    name: "BOT",
    symbol: "BOT",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.bohr.life"],
    },
  },
  blockExplorers: {
    default: {
      name: "BOT Chain Testnet Explorer",
      url: "https://scan.bohr.life/",
    },
  },
});

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is required");
}

const wallets = [
  {
    groupName: "Recommended",
    wallets: [injectedWallet, walletConnectWallet],
  },
];

export const config = createConfig({
  chains: [botChain, botChainTestnet],
  connectors: connectorsForWallets(wallets, {
    appName: "Alpha Lens",
    projectId,
  }),
  transports: {
    [botChain.id]: http(),
    [botChainTestnet.id]: http(),
  },
  ssr: true,
});
