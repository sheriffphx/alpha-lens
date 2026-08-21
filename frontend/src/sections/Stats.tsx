export default function Stats() {
  return (
    <>
      <div className="px-8 py-9 border-y border-white/8 grid grid-cols-2 sm:grid-cols-4 gap-0">
        <div className="text-center border-r border-white/8 px-4">
          <div className="text-[clamp(24px,3vw,34px)] font-black font-jetbrains font-mono tracking-[-0.04em] mb-[6px] bg-[linear-gradient(135deg,rgb(0,212,255)_0%,rgb(167,139,250)_45%,rgb(200,160,80)_100%)] bg-clip-text text-transparent">
            $2.4B
          </div>
          <div className="text-[11px] text-white/32 tracking-[0.04em] font-jetbrains font-mono uppercase">
            portfolio value managed
          </div>
        </div>
        <div className="text-center border-r border-white/8 px-4">
          <div className="text-[clamp(24px,3vw,34px)] font-black font-jetbrains font-mono tracking-[-0.04em] mb-[6px] bg-[linear-gradient(135deg,rgb(0,212,255)_0%,rgb(167,139,250)_45%,rgb(200,160,80)_100%)] bg-clip-text text-transparent">
            18.7%
          </div>
          <div className="text-[11px] text-white/32 tracking-[0.04em] font-jetbrains font-mono uppercase">
            avg. yield uplift
          </div>
        </div>
        <div className="text-center border-r border-white/8 px-4">
          <div className="text-[clamp(24px,3vw,34px)] font-black font-jetbrains font-mono tracking-[-0.04em] mb-[6px] bg-[linear-gradient(135deg,rgb(0,212,255)_0%,rgb(167,139,250)_45%,rgb(200,160,80)_100%)] bg-clip-text text-transparent">
            4,200+
          </div>
          <div className="text-[11px] text-white/32 tracking-[0.04em] font-jetbrains font-mono uppercase">
            active wallets
          </div>
        </div>
        <div className="text-center border-r border-white/8 px-4">
          <div className="text-[clamp(24px,3vw,34px)] font-black font-jetbrains font-mono tracking-[-0.04em] mb-[6px] bg-[linear-gradient(135deg,rgb(0,212,255)_0%,rgb(167,139,250)_45%,rgb(200,160,80)_100%)] bg-clip-text text-transparent">
            $0
          </div>
          <div className="text-[11px] text-white/32 tracking-[0.04em] font-jetbrains font-mono uppercase">
            cost to users — forever
          </div>
        </div>
      </div>
    </>
  );
}
