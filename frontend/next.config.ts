import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

     // next.config.ts
   experimental: {
     turbo: {
       resolveAlias: {
         '@x402/evm': false,
         '@x402/evm/exact/client': false,
       },
     },
   },
};



export default nextConfig;
