import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The generated repository owns CLAUDE.md. Keep Next from auto-upserting
  // framework agent rules into the harness during `next dev`.
  agentRules: false,
};

export default nextConfig;
