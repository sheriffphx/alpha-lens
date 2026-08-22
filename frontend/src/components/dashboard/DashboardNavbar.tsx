"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const tabs = [
  { name: "Overview", href: "/dashboard" },
  { name: "Portfolio", href: "/dashboard/portfolio" },
  { name: "Risk", href: "/dashboard/risk" },
  { name: "Agent", href: "/dashboard/agent" },
  { name: "AlphaLens Copilot", href: "/dashboard/copilot" },
];

export default function DashboardNavbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-black/85 border-b border-white/10">
      <div className="h-[60px] md:h-[72px] px-4 md:px-6 flex items-center gap-2 md:gap-4">
        {/* Left — Back + Logo + Badge */}
        <div className="flex items-center gap-1 shrink-0">
          <Link
            href="/"
            className="text-white/32 px-2 py-1 font-inter text-[13px] leading-[1.5] hover:text-white transition-colors"
          >
            <span className="hidden sm:inline">&larr; Back</span>
            <span className="sm:hidden">&larr;</span>
          </Link>

          <Image src="/logo.svg" alt="AlphaLens Logo" width={32} height={32} />

          <span className="hidden sm:inline font-inter font-bold text-[15px] leading-[1.5] tracking-[-0.02em]">
            AlphaLens
          </span>

          <span className="border border-[#00D4FF]/32 bg-[#00D4FF]/10 text-[#00D4FF] rounded-[3px] font-jetbrains font-mono px-[6px] py-[2px] text-[10px] leading-[1.5] whitespace-nowrap">
            BOT Chain
          </span>
        </div>

        {/* Center — Tabs, hidden here on small screens, shown on md+ */}
        <div className="hidden md:flex flex-1 min-w-0 items-center justify-center gap-1">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-6 py-3 rounded-lg text-[14px] whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-gray-500 hover:text-white"
                }`}
              >
                {tab.name}
              </Link>
            );
          })}
        </div>

        {/* Right — Wallet */}
        <ConnectButton.Custom>
          {({
            account,
            chain,
            mounted,
            openAccountModal,
            openChainModal,
            openConnectModal,
          }) => {
            const isReady = mounted && account && chain;

            return (
              <div className="ml-auto md:ml-0 shrink-0">
                {!isReady ? (
                  <button
                    type="button"
                    onClick={openConnectModal}
                    className="h-12 rounded-full border border-white/10 bg-white/[0.04] px-5 text-[14px] font-medium text-white transition-colors hover:bg-white/[0.08]"
                  >
                    Connect Wallet
                  </button>
                ) : (
                  <div className="flex items-center gap-2 md:gap-3">
                    <button
                      type="button"
                      onClick={openChainModal}
                      className="h-12 rounded-full border border-white/12 bg-[#151d26] px-4 md:px-5 flex items-center gap-3 text-white transition-colors hover:border-white/20 hover:bg-[#1a222d]"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#d86bff] via-[#b34dff] to-[#70a6ff] text-[12px] font-semibold text-white">
                        A
                      </span>
                      <span className="hidden lg:inline font-jetbrains text-[14px] tracking-[-0.01em]">
                        {chain?.name ?? "BOT Chain"}
                      </span>
                      <span className="lg:hidden font-jetbrains text-[14px] tracking-[-0.01em]">
                        {(chain?.name ?? "BOT Chain").replace(" Chain", "")}
                      </span>
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 20 20"
                        className="h-4 w-4 text-white/80"
                        fill="none"
                      >
                        <path
                          d="M5 7.5L10 12.5L15 7.5"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>

                    <span className="hidden md:inline font-jetbrains text-[14px] tracking-[-0.02em] text-[#a6b3b6]">
                      {account.displayBalance}
                    </span>

                    <button
                      type="button"
                      onClick={openAccountModal}
                      className="h-12 rounded-full bg-[#1f2732] px-3 md:px-4 flex items-center gap-3 text-white transition-colors hover:bg-[#263140]"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#c97cff] to-[#5b8cff] text-[12px] font-semibold text-white">
                        {account.displayName?.[0] ?? "A"}
                      </span>
                      <span className="font-jetbrains text-[14px] tracking-[-0.02em]">
                        {account.displayName}
                      </span>
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 20 20"
                        className="h-4 w-4 text-white/80"
                        fill="none"
                      >
                        <path
                          d="M5 7.5L10 12.5L15 7.5"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>

      {/* Second row — tabs only, small screens only */}
      <div className="md:hidden flex items-center justify-center gap-1 px-4 py-2 overflow-x-auto border-t border-white/[0.06]">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-3 py-2 rounded-lg text-[13px] whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-gray-500 hover:text-white"
              }`}
            >
              {tab.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
