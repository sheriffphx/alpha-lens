import HowItWorksCard from "@/components/HowItWorksCard";

export default function HowItWorks() {
  return (
    <>
      <section className="px-8 pb-[clamp(48px,8vh,96px)] max-w-[1100px] mx-auto w-full">
        <div className="text-center mb-14">
          <div className="text-[10px] font-jetbrains font-mono text-[rgb(0,212,255)] tracking-[0.08em] uppercase">
            how it works
          </div>
          <h2 className="mt-[14px] text-[clamp(26px,4vw,44px)] font-extrabold leading-[1.5] tracking-[-0.03em]">
            Connect. Analyze. Execute.
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-8 relative md:grid-cols-3 md:gap-10">
          <div className="pointer-events-none absolute top-[24px] left-[24px] right-[24px] hidden h-px rounded-full bg-[linear-gradient(135deg,rgb(0,212,255)_0%,rgb(167,139,250)_45%,rgb(200,160,80)_100%)] opacity-80 z-0 md:block"></div>
          <HowItWorksCard
            step="01"
            title="Connect wallet"
            description="Link any EVM wallet via WalletConnect or MetaMask.  Read-only by default — no signing required to start."
          />
          <HowItWorksCard
            step="02"
            title="Al analyzes positions"
            description="Copilot scans on-chain data, protocol APIs, and unlock schedules to build a full risk and yield picture."
          />
          <HowItWorksCard
            step="03"
            title="Execute recommendations"
            description="Review each action with full gas estimates. Approve and sign directly in the dashboard. 100% free."
          />
        </div>
      </section>
    </>
  );
}
