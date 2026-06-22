import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Không dùng output: "export" — app CRM cần Node server (next start / app.js)
  staticPageGenerationTimeout: 180,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Giảm worker khi build trên VPS RAM thấp (tránh worker OOM → _global-error fail)
    cpus: 1,
  },
};

export default nextConfig;
