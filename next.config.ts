import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/artigos", destination: "/articles", permanent: true },
      { source: "/artigos/:slug", destination: "/articles/:slug", permanent: true },
      { source: "/cursos", destination: "/courses", permanent: true },
      { source: "/cursos/:slug", destination: "/courses/:slug", permanent: true },
      { source: "/materiais", destination: "/materials", permanent: true },
    ];
  },
  experimental: {
    // DevTools: evita bug SegmentViewNode / manifest RSC em alguns setups
    devtoolSegmentExplorer: false,
    // Reduz chunks RSC “fantasma” após HMR (erro __webpack_modules__[id] is not a function)
    serverComponentsHmrCache: false,
  },
};

export default nextConfig;
