"use client";

import Image from "next/image";
import { LaunchAppButton } from "@/components/Button";
import { useRouter } from "next/navigation";
import { useAccountEffect } from "wagmi";

export default function Navbar() {
  const router = useRouter();

  useAccountEffect({
    onConnect() {
      router.push("/dashboard");
    },
  });

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 flex justify-between items-center px-8 bg-black/70 backdrop-blur-[20px] border-b border-white/8 text-white">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="AlphaLens Logo" width={32} height={32} />{" "}
          {/** @check */}
          <span className="font-inter text-[15px] font-bold leading-[22.5px] tracking-[-0.3px] text-white">
            AlphaLens
          </span>
        </div>
        <span className="px-2 py-0.5 font-mono font-normal text-[10px] leading-[15px] text-[#00D4FF] bg-[#00D4FF]/10 rounded-[3px] border border-[#00D4FF]/20">
          BOT chain
        </span>
      </div>
      <LaunchAppButton className="px-5 py-2 inline-flex items-center font-jetbrains font-bold text-[13px] leading-[19.5px] tracking-[-0.26px] text-black border rounded-[8px] bg-[linear-gradient(135deg,rgb(0,212,255)_0%,rgb(167,139,250)_45%,rgb(200,160,80)_100%)]">
        Launch App &rarr;
      </LaunchAppButton>
    </nav>
  );
}
