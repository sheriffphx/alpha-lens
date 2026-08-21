type DashboardComingSoonProps = {
  title: string;
};

export default function DashboardComingSoon({
  title,
}: DashboardComingSoonProps) {
  return (
    <section className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-10 md:min-h-[calc(100vh-88px)]">
      <div className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-white/[0.03] px-6 py-12 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_30px_80px_rgba(0,0,0,0.4)] backdrop-blur-sm md:px-10 md:py-16">
        <p className="font-jetbrains text-[11px] uppercase tracking-[0.28em] text-[#7f92a5]">
          {title}
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white md:text-5xl">
          Coming soon
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-white/60 md:text-base">
          This section is wired into the dashboard navigation and will be filled
          in next.
        </p>
      </div>
    </section>
  );
}
