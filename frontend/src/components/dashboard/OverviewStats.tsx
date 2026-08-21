type OverviewStatsProps = {
  title: string;
  value: string;
  description: string;
};

export default function OverviewStats({
  title,
  value,
  description,
}: OverviewStatsProps) {
  return (
    <div className="bg-[rgba(255,255,255,0.043)] backdrop-blur-[24px] border border-[rgba(255,255,255,0.08)] rounded-[10px] px-[20px] py-[18px]">
      <div className="font-jetbrains font-mono font-normal text-[10px] text-[rba(255,255,255,0.32)], leading-[1.5] tracking-[0.08em] uppercase">
        {title}
      </div>
      <div className="text-[22px] font-inter leading-[1.5] font-extrabold text-[rgb(255,255,255)] tracking-[-0.03em] mt-2 mb-1">
        {value}
      </div>
      <div className="text-[12px] font-inter leading-[1.5] text-[rgb(0,212,255)]">
        {description}
      </div>
    </div>
  );
}
