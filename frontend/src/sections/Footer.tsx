import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.08] py-5 px-8 flex justify-between items-center flex-wrap gap-[12px]">
      <div className="flex items-center gap-[10px]">
        <Image src="/logo.svg" alt="AlphaLens Logo" width={24} height={24} />
        <span className="text-[13px] font-semibold text-white/32">
          AlphaLens
        </span>
        <span className="text-[11px] font-jetbrains font-mono text-white/32">
          &#183; Powered by BOT Chain
        </span>
      </div>
      <div className="text-[12px] font-jetbrains font-mono text-white/32">
        &copy; {new Date().getFullYear()} &#183; Free &#183; Non-custodial
        &#183; Open Beta
      </div>
    </footer>
  );
}
