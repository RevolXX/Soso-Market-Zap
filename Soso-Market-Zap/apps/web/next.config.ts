import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  distDir: isDev ? ".next-dev" : ".next",
  outputFileTracingRoot: undefined,
  transpilePackages: ["@market-zap/shared", "@market-zap/sosovalue-client"],
};

export default nextConfig;
