import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["snarkjs"],
  turbopack: {},
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      readline: false,
    };
    return config;
  },
};

export default nextConfig;
