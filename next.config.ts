import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/playwright-core/**'],
    '/api/deal': ['./node_modules/playwright-core/**'],
    '/api/deal/[id]': ['./node_modules/playwright-core/**'],
  },
};

export default nextConfig;
