import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // DevTools: evita bug SegmentViewNode / manifest RSC em alguns setups
    devtoolSegmentExplorer: false,
    // Reduz chunks RSC “fantasma” após HMR (erro __webpack_modules__[id] is not a function)
    serverComponentsHmrCache: false,
  },
};

export default nextConfig;
