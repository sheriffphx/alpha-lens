type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

export default function FeatureCard({
  icon,
  title,
  description,
}: FeatureCardProps) {
  return (
    <div className="bg-[rgba(255,255,255,0.043)] backdrop-blur-[24px] border border-[rgba(255,255,255,0.08)] rounded-[10px] px-9 py-8 transition-all duration-180 hover:bg-[rgba(255,255,255,0.1)] hover:backdrop-blur-[32px] hover:border-[rgba(255,255,255,0.12)]">
      <div className="text-[22px] mb-4 leading-[1.5]">{icon}</div>
      <div className="font-bold text-[16px] leading-[1.5] tracking-[-0.02em] mb-[10px]">
        {title}
      </div>
      <div className="text-[14px] text-[rgba(255,255,255,0.55)] leading-[1.7] tracking-[-0.02em]">
        {description}
      </div>
    </div>
  );
}
