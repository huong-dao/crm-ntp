import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Không dùng output: "export" — app CRM cần Node server (next start / app.js)
  staticPageGenerationTimeout: 180,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Giảm worker khi build trên hosting RAM/thread thấp (CloudLinux/cPanel)
    workerThreads: false,
    cpus: 1,
  },
};

export default nextConfig;
