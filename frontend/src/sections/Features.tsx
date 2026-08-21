import FeatureCard from "@/components/FeatureCard";

export default function Features() {
  return (
    <>
      <section className="px-[32px] py-[clamp(48px,8vw,96px)] max-w-[1100px] mx-auto w-full">
        <div className="text-center mb-14">
          <div className="text-[10px] font-jetbrains font-mono text-[rgb(0,212,255)] tracking-[0.08em] uppercase">
            capabilities
          </div>
          <h2 className="mt-[14px] text-[clamp(26px,4vw,44px)] font-extrabold leading-[1.5] tracking-[-0.03em]">
            Every signal your portfolio needs
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FeatureCard
            icon="📈"
            title="Idle Asset Detection"
            description="Al scans every wallet position to identify capital sitting at 0% APY and surfaces high-yield deployment options across protocols."
          />
          <FeatureCard
            icon="⚠️"
            title="Liquidation Risk Monitor"
            description="Real-time health factor tracking across Aave, Compound, and MakerDAO. Alerts before you hit the danger zone."
          />
          <FeatureCard
            icon="🎯"
            title="Agent"
            description="Set custom trading and execution rules. Autonomous AI continuously monitors market conditions and executes transactions the moment your criteria are met."
          />
          <FeatureCard
            icon="🤖"
            title="AlphaLens Copilot"
            description="Ask anything about your portfolio in plain English. Get instant AI-powered answers on risk, yield, timing, and execution."
          />
        </div>
      </section>
    </>
  );
}
