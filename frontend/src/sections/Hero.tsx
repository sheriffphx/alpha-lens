import { LaunchAppButton } from "@/components/Button";

export default function Hero() {
  return (
    <>
      <section className="relative flex flex-col items-center justify-start min-h-screen px-6 pt-[1px] pb-6 overflow-hidden text-center text-white">
        <canvas></canvas>
        <div className="absolute top-[30%] left-[20%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(0,212,255,0.07)_0%,transparent_70%)] pointer-events-none blur-[40px]"></div>
        <div className="absolute top-[40%] left-[15%] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.07)_0%,transparent_70%)] pointer-events-none blur-[40px]"></div>
        <div className="relative z-2 max-w-[840px] w-full">
          <div className="inline-flex items-center gap-2 rounded-[20px] px-[14px] py-[5px] mb-8 bg-white/[0.05] border border-white/[0.08]">
            <span className="inline-block w-[6px] h-[6px] rounded-[50%] bg-[linear-gradient(135deg,rgb(0,212,255)_0%,rgb(167,139,250)_45%,rgb(200,160,80)_100%)]"></span>
            <span className="text-[12px] font-jetbrains text-[rgba(255,255,255,0.55)] leading-[18px] tracking-[0.72px]">
              Built on BOT Chain . EVM Compatible
            </span>
          </div>
          <h1 className="mb-6 text-[clamp(32px,6vw,72px)] font-inter font-black leading-[1.04] tracking-[-0.04em]">
            Your portfolio&apos;s{" "}
            <span className="font-inter bg-[linear-gradient(135deg,rgb(0,212,255)_0%,rgb(167,139,250)_45%,rgb(200,160,80)_100%)] bg-clip-text text-transparent">
              AI copilot
            </span>{" "}
            for DeFi
          </h1>
          <p className="text-[18px] text-white/55 mx-auto mt-0 mb-11 max-w-[540px] font-inter font-normal leading-[1.7] tracking-[-0.02em]">
            Detect idle capital, monitor risk, discover yield opportunities, and
            let AI decide and execute — all on-chain
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <LaunchAppButton className="cursor-pointer border-none px-[32px] py-[14px] font-jetbrains font-mono font-extrabold text-[15px] leading-[22.5px] tracking-[-0.02em] text-black rounded-[8px] bg-[linear-gradient(135deg,rgb(0,212,255)_0%,rgb(167,139,250)_45%,rgb(200,160,80)_100%)] transition-all duration-200 hover:shadow-[0_0_40px_rgba(0,212,255,0.2)] whitespace-nowrap translate-y-0 hover:-translate-y-[1px]">
              Launch App — Free &rarr;
            </LaunchAppButton>
            <a
              href="https://docs.google.com/document/d/14mfA7f-7ANPxPnUx2SBdEyxwIU1Ya6uPKylwoGFtl2c/edit?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-[28px] py-[14px] font-jetbrains font-semibold text-[15px] leading-[22.5px] text-white/55 rounded-[8px] bg-white/5 backdrop-blur-[12px] border border-white/[0.08] cursor-pointer transition-all duration-150 hover:text-white"
            >
              Watch demo
            </a>
          </div>
          <div className="mt-[44px] flex flex-wrap gap-[28px] justify-center items-center">
            <span className="flex items-center gap-[7px] font-inter text-[12px] leading-[18px] font-normal text-white/32">
              <CheckIcon /> Always free
            </span>
            <span className="flex items-center gap-[7px] font-inter text-[12px] leading-[18px] font-normal text-white/32">
              <CheckIcon /> Non-custodial
            </span>
            <span className="flex items-center gap-[7px] font-inter text-[12px] leading-[18px] font-normal text-white/32">
              <CheckIcon /> BOT Chain native
            </span>
            <span className="flex items-center gap-[7px] font-inter text-[12px] leading-[18px] font-normal text-white/32">
              <CheckIcon /> Sign-to-execute only
            </span>
          </div>
        </div>
      </section>
    </>
  );
}

// Checkmark Icon Helper
function CheckIcon() {
  return (
    <svg
      className="w-4 h-4 text-[#00D4FF]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
