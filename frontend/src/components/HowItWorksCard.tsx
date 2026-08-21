type HowItWorksCardProps = {
  step: string;
  title: string;
  description: string;
};

export default function HowItWorksCard({
  step,
  title,
  description,
}: HowItWorksCardProps) {
  return (
    <div className="relative z-10">
      <div className="w-[48px] h-[48px] border rounded-[50%] bg-[rgba(255,255,255,0.043)] border-[rgba(255,255,255,0.08)] backdrop-blur-[12px] flex items-center justify-center font-jetbrains font-mono text-13px font-bold mb-[20px]">
        <span className="bg-[linear-gradient(135deg,rgb(0,212,255)_0%,rgb(167,139,250)_45%,rgb(200,160,80)_100%)] bg-clip-text text-transparent">
          {step}
        </span>
      </div>
      <div className="font-bold text-[16px] leading-[1.5] tracking-[-0.02em] mb-[10px]">
        {title}
      </div>
      <div className="text-[14px] text-[rgba(255,255,255,0.55)] leading-[1.7] tracking-[-0.02em]">
        {description}
      </div>
    </div>
  );
}
