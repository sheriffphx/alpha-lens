import { LaunchAppButton } from "@/components/Button";

export default function CTA() {
  return (
    <>
      <section className="border-t border-white/[0.08] py-[clamp(56px,8vw,96px)] px-8 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[radial-gradient(rgba(167,139,250,0.07)_0%,transparent_70%)] pointer-events-none blur-[20px]"></div>{" "}
        <h2 className=" mb-[14px] justify-center mt-[4px] text-[clamp(26px,4vw,50px)] font-black leading-[1.5] tracking-[-0.04em] relative">
          Stop leaving yield on the table.
        </h2>
        <p className="mx-auto mb-[36px] text-[16px] leading-[1.5] text-white/[0.55] max-w-[420px]">
          Your portfolio is working against you. Let the copilot work for it —
          completely free on BOT Chain
        </p>
        <LaunchAppButton className="px-11 py-4 font-jetbrains font-mono font-extrabold text-[16px] cursor-pointer leading-[1.5] tracking-[-0.02em] text-black rounded-[8px] bg-[linear-gradient(135deg,rgb(0,212,255)_0%,rgb(167,139,250)_45%,rgb(200,160,80)_100%)] transition-all duration-200 shadow-[0_0_40px_rgba(0,212,255,0.2)] whitespace-nowrap translate-y-0">
          Launch App — it&apos;s free &rarr;
        </LaunchAppButton>
      </section>
    </>
  );
}
