import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Lint runs separately via `npm run lint` (ESLint flat config).
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
